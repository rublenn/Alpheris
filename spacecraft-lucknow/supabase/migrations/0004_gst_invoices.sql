-- GST invoices
--   * Prices on the site INCLUDE GST. Each product has a GST rate and HSN code.
--   * Seller: Purvanchal Panels Private Limited, GSTIN 09… (Uttar Pradesh).
--     Online delivery is only inside Lucknow, so every order is intra-state:
--     the GST is split equally into CGST + SGST.
--   * A paid order gets the next invoice number for its financial year,
--     e.g. SC/2026-27/0001. Numbers are never reused.

alter table public.products
  add column if not exists gst_rate numeric(5,2) not null default 18
    check (gst_rate >= 0 and gst_rate <= 40),
  add column if not exists hsn_code text
    check (hsn_code is null or hsn_code ~ '^[0-9]{4,8}$');

alter table public.orders
  add column if not exists customer_gstin text
    check (customer_gstin is null or customer_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  add column if not exists customer_business_name text,
  add column if not exists invoice_number text unique,
  add column if not exists invoice_date timestamptz;

alter table public.order_items
  add column if not exists gst_rate numeric(5,2) not null default 18,
  add column if not exists hsn_code text;

create table if not exists public.invoice_counters (
  financial_year text primary key,  -- e.g. '2026-27'
  last_number    int not null default 0
);
alter table public.invoice_counters enable row level security;
grant all on public.invoice_counters to service_role;

-- Next invoice number, e.g. SC/2026-27/0001 (Indian financial year starts 1 April).
create or replace function public.next_invoice_number(p_at timestamptz)
returns text
language plpgsql set search_path = public as $$
declare
  v_local date := (p_at at time zone 'Asia/Kolkata')::date;
  v_start int := case when extract(month from v_local) >= 4 then extract(year from v_local)::int
                      else extract(year from v_local)::int - 1 end;
  v_fy text := v_start || '-' || lpad(((v_start + 1) % 100)::text, 2, '0');
  v_n int;
begin
  insert into public.invoice_counters (financial_year, last_number) values (v_fy, 1)
  on conflict (financial_year) do update set last_number = invoice_counters.last_number + 1
  returning last_number into v_n;
  return 'SC/' || v_fy || '/' || lpad(v_n::text, 4, '0');
end $$;

-- create_pending_order: now also stores the customer's GSTIN / business name
-- and a copy of each item's GST rate and HSN code.
create or replace function public.create_pending_order(p_customer jsonb, p_items jsonb, p_shipping_paise int default 0)
returns public.orders
language plpgsql set search_path = public as $$
declare
  v_order   public.orders;
  v_item    jsonb;
  v_row     record;
  v_qty     int;
  v_unit    int;
  v_sub     int := 0;
  v_number  text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'CART_EMPTY';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'CART_TOO_LARGE';
  end if;

  loop
    v_number := 'SC' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;

  insert into public.orders (order_number, customer_name, customer_phone, customer_email,
    address_line1, address_line2, city, state, pincode, notes,
    customer_gstin, customer_business_name,
    subtotal_paise, shipping_paise, total_paise)
  values (v_number,
    trim(p_customer->>'name'), trim(p_customer->>'phone'), lower(trim(p_customer->>'email')),
    trim(p_customer->>'address_line1'), coalesce(trim(p_customer->>'address_line2'), ''),
    trim(p_customer->>'city'), trim(p_customer->>'state'), trim(p_customer->>'pincode'),
    coalesce(trim(p_customer->>'notes'), ''),
    nullif(upper(trim(coalesce(p_customer->>'gstin', ''))), ''),
    nullif(trim(coalesce(p_customer->>'business_name', '')), ''),
    0, greatest(p_shipping_paise, 0), 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 999 then
      raise exception 'BAD_QUANTITY';
    end if;

    select v.id, v.sku, v.label, v.stock, coalesce(v.sale_price_paise, v.price_paise) as unit,
           p.name as product_name, p.gst_rate, p.hsn_code
      into v_row
      from public.variants v join public.products p on p.id = v.product_id
     where v.id = (v_item->>'variant_id')::uuid and v.is_active and p.is_active;

    if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
    if v_row.unit is null then raise exception 'PRICE_ON_REQUEST:%', v_row.sku; end if;
    if v_row.stock < v_qty then raise exception 'OUT_OF_STOCK:%', v_row.sku; end if;

    v_unit := v_row.unit;
    v_sub := v_sub + v_unit * v_qty;
    insert into public.order_items (order_id, variant_id, product_name, variant_label, sku,
      unit_price_paise, quantity, line_total_paise, gst_rate, hsn_code)
    values (v_order.id, v_row.id, v_row.product_name, v_row.label, v_row.sku,
      v_unit, v_qty, v_unit * v_qty, v_row.gst_rate, v_row.hsn_code);
  end loop;

  update public.orders
     set subtotal_paise = v_sub, total_paise = v_sub + shipping_paise
   where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (order_id, status, note)
  values (v_order.id, 'pending_payment', 'Order placed, waiting for payment');
  return v_order;
end $$;

-- mark_order_paid: now also gives the order its invoice number.
create or replace function public.mark_order_paid(p_razorpay_order_id text, p_payment_id text)
returns public.orders
language plpgsql set search_path = public as $$
declare
  v_order public.orders;
  v_item  record;
  v_after int;
begin
  select * into v_order from public.orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status not in ('pending_payment', 'payment_failed') then
    return v_order; -- already handled
  end if;

  for v_item in select * from public.order_items where order_id = v_order.id and variant_id is not null loop
    update public.variants set stock = greatest(stock - v_item.quantity, 0)
     where id = v_item.variant_id returning stock into v_after;
    insert into public.stock_movements (variant_id, change, stock_after, reason, order_id)
    values (v_item.variant_id, -v_item.quantity, v_after, 'order_paid', v_order.id);
  end loop;

  update public.orders
     set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now(),
         invoice_number = coalesce(invoice_number, public.next_invoice_number(now())),
         invoice_date = coalesce(invoice_date, now())
   where id = v_order.id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (v_order.id, 'paid', 'Payment received');
  return v_order;
end $$;

revoke all on function public.next_invoice_number(timestamptz) from public, anon, authenticated;
revoke all on function public.create_pending_order(jsonb, jsonb, int) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;
grant execute on function public.next_invoice_number(timestamptz) to service_role;
grant execute on function public.create_pending_order(jsonb, jsonb, int) to service_role;
grant execute on function public.mark_order_paid(text, text) to service_role;
