-- Lets the server check whether an email belongs to an admin before sending a
-- password-reset link (auth.users is not reachable through the normal API).
create or replace function public.is_admin_email(p_email text)
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u join public.admins a on a.user_id = u.id
    where lower(u.email) = lower(trim(p_email))
  );
$$;
revoke all on function public.is_admin_email(text) from public, anon, authenticated;
grant execute on function public.is_admin_email(text) to service_role;
