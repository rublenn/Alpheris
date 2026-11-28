-- Table permissions. This project does not give new tables to the API roles
-- automatically, so we grant exactly what is needed.
--   anon / authenticated: may only SELECT the catalogue (RLS still limits it to active rows)
--   service_role (the server's secret key): full access
grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.brands, public.products, public.product_images, public.variants
  to anon, authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Belt and braces: the public roles get nothing beyond the SELECTs above.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
