-- When the "new order" email to the shop was sent. Used so one order never
-- triggers two emails (the browser and the Razorpay webhook both confirm payment).
alter table public.orders add column if not exists alert_sent_at timestamptz;
