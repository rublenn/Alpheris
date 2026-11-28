-- Each option (variant) can have its own photo, e.g. one photo per panel design.
alter table public.variants
  add column if not exists image_url text,
  add column if not exists image_path text;
