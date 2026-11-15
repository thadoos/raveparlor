-- Projects created without "automatically expose new tables" give no default access to new
-- objects. Grant what the seed/migrate scripts (service_role) and the RLS checks need.
grant select, insert, update, delete on public.admins, public.site_content, public.content_versions to service_role;
grant execute on function public.is_admin() to authenticated, service_role;
