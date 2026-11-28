-- 1) What the price is for ("sheet", "roll", "piece", "set of 2", "panel" ...), shown next to every price.
alter table public.products add column if not exists price_unit text;

-- 2) The shop does not track stock: every priced option can always be ordered.
--    The stock column stays in the table but is no longer checked or changed.
create or replace function public.create_pending_order(p_customer jsonb, p_items jsonb, p_shipping_paise int default 0)
returns public.orders
language plpgsql set search_path = public as $$
declare
  v_order public.orders; v_item jsonb; v_row record; v_qty int; v_unit int; v_sub int := 0; v_number text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'CART_EMPTY'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'CART_TOO_LARGE'; end if;
  loop
    v_number := 'SC' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
                || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;
  insert into public.orders (order_number, customer_name, customer_phone, customer_email,
    address_line1, address_line2, city, state, pincode, notes, customer_gstin, customer_business_name,
    subtotal_paise, shipping_paise, total_paise)
  values (v_number, trim(p_customer->>'name'), trim(p_customer->>'phone'), lower(trim(p_customer->>'email')),
    trim(p_customer->>'address_line1'), coalesce(trim(p_customer->>'address_line2'), ''),
    trim(p_customer->>'city'), trim(p_customer->>'state'), trim(p_customer->>'pincode'),
    coalesce(trim(p_customer->>'notes'), ''),
    nullif(upper(trim(coalesce(p_customer->>'gstin', ''))), ''), nullif(trim(coalesce(p_customer->>'business_name', '')), ''),
    0, greatest(p_shipping_paise, 0), 0)
  returning * into v_order;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 999 then raise exception 'BAD_QUANTITY'; end if;
    select v.id, v.sku, v.label, coalesce(v.sale_price_paise, v.price_paise) as unit,
           p.name as product_name, p.gst_rate, p.hsn_code
      into v_row
      from public.variants v join public.products p on p.id = v.product_id
     where v.id = (v_item->>'variant_id')::uuid and v.is_active and p.is_active;
    if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
    if v_row.unit is null then raise exception 'PRICE_ON_REQUEST:%', v_row.sku; end if;
    v_unit := v_row.unit; v_sub := v_sub + v_unit * v_qty;
    insert into public.order_items (order_id, variant_id, product_name, variant_label, sku,
      unit_price_paise, quantity, line_total_paise, gst_rate, hsn_code)
    values (v_order.id, v_row.id, v_row.product_name, v_row.label, v_row.sku, v_unit, v_qty, v_unit * v_qty, v_row.gst_rate, v_row.hsn_code);
  end loop;
  update public.orders set subtotal_paise = v_sub, total_paise = v_sub + shipping_paise where id = v_order.id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (v_order.id, 'pending_payment', 'Order placed, waiting for payment');
  return v_order;
end $$;

create or replace function public.mark_order_paid(p_razorpay_order_id text, p_payment_id text)
returns public.orders
language plpgsql set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where razorpay_order_id = p_razorpay_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status not in ('pending_payment', 'payment_failed') then return v_order; end if;
  update public.orders
     set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now(),
         invoice_number = coalesce(invoice_number, public.next_invoice_number(now())),
         invoice_date = coalesce(invoice_date, now())
   where id = v_order.id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (v_order.id, 'paid', 'Payment received');
  return v_order;
end $$;

create or replace function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns public.orders
language plpgsql set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = p_status then return v_order; end if;
  if v_order.status = 'cancelled' then raise exception 'ORDER_ALREADY_CANCELLED'; end if;
  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (p_order_id, p_status, nullif(trim(p_note), ''));
  return v_order;
end $$;

revoke all on function public.create_pending_order(jsonb, jsonb, int) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_pending_order(jsonb, jsonb, int) to service_role;
grant execute on function public.mark_order_paid(text, text) to service_role;
grant execute on function public.set_order_status(uuid, text, text) to service_role;
