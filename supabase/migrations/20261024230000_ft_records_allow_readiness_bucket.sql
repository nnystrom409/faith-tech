-- Let the shared readiness checklist live in ft_records (bucket "readiness", id = church id).
alter table public.ft_records drop constraint ft_records_bucket_check;
alter table public.ft_records add constraint ft_records_bucket_check
  check (bucket = any (array['users'::text, 'churches'::text, 'readiness'::text]));
