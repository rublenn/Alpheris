-- Space Craft Lucknow — shop database (Phases 2–5)
-- Catalogue: categories → brands → products → variants (+ photos)
-- Stock: a number on each variant, plus a ledger of every change
-- Orders: order, its items and a status timeline for tracking
--
-- Security model
--   * Row Level Security is ON for every table.
--   * The public (anon key) can only READ active catalogue rows.
--   * Orders, stock changes and admin work happen on the server with the
--     secret key, after the server has checked the admin login.

-- ───────────────────────── helpers ─────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── catalogue ─────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (length(trim(name)) > 0),
  blurb       text not null default '',
  image_url   text,
  swatch      jsonb,               -- illustrated texture used when there is no photo
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (length(trim(name)) > 0),
  description text not null default '',
  logo_url    text,
  is_sample   boolean not null default false,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null check (length(trim(name)) > 0),
  category_id    uuid not null references public.categories(id) on delete restrict,
  brand_id       uuid references public.brands(id) on delete set null,
  description    text not null default '',
  material       text,
  specifications jsonb not null default '{}'::jsonb,
  swatch         jsonb,
  is_featured    boolean not null default false,
  is_active      boolean not null default true,
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text not null default '',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id);

-- Prices are whole paise (₹1 = 100 paise). NULL price = "price on request" (cannot be bought online).
create table public.variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  sku              text not null unique check (length(trim(sku)) > 0),
  label            text not null check (length(trim(label)) > 0),
  colour           text,
  finish           text,
  dimensions       text,
  price_paise      int check (price_paise is null or price_paise >= 100),
  sale_price_paise int check (sale_price_paise is null or sale_price_paise >= 100),
  stock            int not null default 0 check (stock >= 0),
  is_active        boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (sale_price_paise is null or (price_paise is not null and sale_price_paise < price_paise))
);
create index variants_product_idx on public.variants(product_id);

-- Every stock change is written here (admin edits, orders, cancellations).
create table public.stock_movements (
  id         bigint generated always as identity primary key,
  variant_id uuid not null references public.variants(id) on delete cascade,
  change     int not null,
  stock_after int not null,
  reason     text not null check (reason in ('initial','admin_adjust','order_paid','order_cancelled')),
  order_id   uuid,
  note       text,
  created_at timestamptz not null default now()
);
create index stock_movements_variant_idx on public.stock_movements(variant_id);

-- ───────────────────────── orders ─────────────────────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,
  access_token        uuid not null default gen_random_uuid(),
  status              text not null default 'pending_payment' check (status in
                        ('pending_payment','payment_failed','paid','processing','shipped','delivered','cancelled')),
  customer_name       text not null,
  customer_phone      text not null,
  customer_email      text not null,
  address_line1       text not null,
  address_line2       text not null default '',
  city                text not null,
  state               text not null,
  pincode             text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  notes               text not null default '',
  subtotal_paise      int not null check (subtotal_paise >= 0),
  shipping_paise      int not null default 0 check (shipping_paise >= 0),
  total_paise         int not null check (total_paise >= 0),
  currency            text not null default 'INR',
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_status_idx on public.orders(status, created_at desc);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  variant_id       uuid references public.variants(id) on delete set null,
  product_name     text not null,
  variant_label    text not null,
  sku              text not null,
  unit_price_paise int not null check (unit_price_paise >= 0),
  quantity         int not null check (quantity between 1 and 999),
  line_total_paise int not null check (line_total_paise >= 0)
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id);

-- Who may use /admin. A user must exist in Supabase Auth AND be listed here.
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();
create trigger brands_touch     before update on public.brands     for each row execute function public.touch_updated_at();
create trigger products_touch   before update on public.products   for each row execute function public.touch_updated_at();
create trigger variants_touch   before update on public.variants   for each row execute function public.touch_updated_at();
create trigger orders_touch     before update on public.orders     for each row execute function public.touch_updated_at();

-- ───────────────────────── row level security ─────────────────────────
alter table public.categories           enable row level security;
alter table public.brands               enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.variants             enable row level security;
alter table public.stock_movements      enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admins               enable row level security;

create policy "public reads active categories" on public.categories for select using (is_active);
create policy "public reads active brands"     on public.brands     for select using (is_active);
create policy "public reads active products"   on public.products   for select using (is_active);
create policy "public reads product images"    on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));
create policy "public reads active variants"   on public.variants   for select
  using (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active));
-- No policies on stock_movements, orders, order_items, order_status_history, admins:
-- only the server (secret key) can touch them.

-- ───────────────────────── order functions (server only) ─────────────────────────

-- Creates an order from {variant_id, quantity} pairs. Prices and stock are read
-- from the database here, so a customer can never change the price in the browser.
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
    subtotal_paise, shipping_paise, total_paise)
  values (v_number,
    trim(p_customer->>'name'), trim(p_customer->>'phone'), lower(trim(p_customer->>'email')),
    trim(p_customer->>'address_line1'), coalesce(trim(p_customer->>'address_line2'), ''),
    trim(p_customer->>'city'), trim(p_customer->>'state'), trim(p_customer->>'pincode'),
    coalesce(trim(p_customer->>'notes'), ''),
    0, greatest(p_shipping_paise, 0), 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 999 then
      raise exception 'BAD_QUANTITY';
    end if;

    select v.id, v.sku, v.label, v.stock, coalesce(v.sale_price_paise, v.price_paise) as unit, p.name as product_name
      into v_row
      from public.variants v join public.products p on p.id = v.product_id
     where v.id = (v_item->>'variant_id')::uuid and v.is_active and p.is_active;

    if not found then raise exception 'ITEM_UNAVAILABLE'; end if;
    if v_row.unit is null then raise exception 'PRICE_ON_REQUEST:%', v_row.sku; end if;
    if v_row.stock < v_qty then raise exception 'OUT_OF_STOCK:%', v_row.sku; end if;

    v_unit := v_row.unit;
    v_sub := v_sub + v_unit * v_qty;
    insert into public.order_items (order_id, variant_id, product_name, variant_label, sku, unit_price_paise, quantity, line_total_paise)
    values (v_order.id, v_row.id, v_row.product_name, v_row.label, v_row.sku, v_unit, v_qty, v_unit * v_qty);
  end loop;

  update public.orders
     set subtotal_paise = v_sub, total_paise = v_sub + shipping_paise
   where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (order_id, status, note)
  values (v_order.id, 'pending_payment', 'Order placed, waiting for payment');
  return v_order;
end $$;

-- Marks an order paid after the server has verified the Razorpay signature.
-- Safe to call twice (browser + webhook): the second call changes nothing.
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

  update public.orders set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now()
   where id = v_order.id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (v_order.id, 'paid', 'Payment received');
  return v_order;
end $$;

-- Admin changes an order's status. Cancelling a paid order puts the stock back.
create or replace function public.set_order_status(p_order_id uuid, p_status text, p_note text default null)
returns public.orders
language plpgsql set search_path = public as $$
declare
  v_order public.orders;
  v_item  record;
  v_after int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = p_status then return v_order; end if;
  if v_order.status = 'cancelled' then raise exception 'ORDER_ALREADY_CANCELLED'; end if;

  if p_status = 'cancelled' and v_order.status in ('paid','processing','shipped') then
    for v_item in select * from public.order_items where order_id = v_order.id and variant_id is not null loop
      update public.variants set stock = stock + v_item.quantity where id = v_item.variant_id returning stock into v_after;
      if found then
        insert into public.stock_movements (variant_id, change, stock_after, reason, order_id)
        values (v_item.variant_id, v_item.quantity, v_after, 'order_cancelled', v_order.id);
      end if;
    end loop;
  end if;

  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  insert into public.order_status_history (order_id, status, note) values (p_order_id, p_status, nullif(trim(p_note), ''));
  return v_order;
end $$;

-- Admin sets a variant's stock to an exact number and the change is logged.
create or replace function public.set_variant_stock(p_variant_id uuid, p_stock int, p_note text default null)
returns int
language plpgsql set search_path = public as $$
declare
  v_before int;
begin
  if p_stock < 0 then raise exception 'BAD_STOCK'; end if;
  select stock into v_before from public.variants where id = p_variant_id for update;
  if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
  if v_before = p_stock then return p_stock; end if;
  update public.variants set stock = p_stock where id = p_variant_id;
  insert into public.stock_movements (variant_id, change, stock_after, reason, note)
  values (p_variant_id, p_stock - v_before, p_stock, 'admin_adjust', nullif(trim(p_note), ''));
  return p_stock;
end $$;

-- Only the server (service_role) may run these.
revoke all on function public.create_pending_order(jsonb, jsonb, int) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text)            from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text, text)     from public, anon, authenticated;
revoke all on function public.set_variant_stock(uuid, int, text)     from public, anon, authenticated;
grant execute on function public.create_pending_order(jsonb, jsonb, int) to service_role;
grant execute on function public.mark_order_paid(text, text)            to service_role;
grant execute on function public.set_order_status(uuid, text, text)     to service_role;
grant execute on function public.set_variant_stock(uuid, int, text)     to service_role;

-- ───────────────────────── photo storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
-- Public bucket = anyone can VIEW a photo by its link. Uploads/deletes only via the server (secret key).
