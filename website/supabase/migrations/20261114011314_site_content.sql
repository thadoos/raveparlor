-- Site content: one editable JSON document (draft + published), its publish history, and the
-- admins allowed to change it. Images live in the public `site-images` storage bucket.

-- Tables ------------------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

create table public.site_content (
  id text primary key check (id in ('draft', 'published')),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.content_versions (
  id bigint generated always as identity primary key,
  content jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid
);

alter table public.admins enable row level security;
alter table public.site_content enable row level security;
alter table public.content_versions enable row level security;

-- Least privilege on top of RLS (TRUNCATE is not covered by RLS). Writes other than the draft
-- update go through the security definer functions below or the secret key.
revoke all on public.admins, public.site_content, public.content_versions from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant update (content, updated_at) on public.site_content to authenticated;
grant select on public.admins, public.content_versions to authenticated;

-- Functions ---------------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create function public.publish_draft()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  draft_content jsonb;
  published_time timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select content into draft_content from public.site_content where id = 'draft' for update;
  if draft_content is null then
    raise exception 'no draft to publish';
  end if;

  insert into public.site_content (id, content, updated_at)
  values ('published', draft_content, published_time)
  on conflict (id) do update set content = excluded.content, updated_at = excluded.updated_at;

  insert into public.content_versions (content, published_at, published_by)
  values (draft_content, published_time, auth.uid());

  return published_time;
end;
$$;

create function public.discard_draft()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_content jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select content into published_content from public.site_content where id = 'published';
  if published_content is null then
    raise exception 'no published content';
  end if;

  update public.site_content set content = published_content, updated_at = now() where id = 'draft';
end;
$$;

revoke execute on function public.publish_draft() from public, anon;
revoke execute on function public.discard_draft() from public, anon;
grant execute on function public.publish_draft() to authenticated;
grant execute on function public.discard_draft() to authenticated;

-- Policies ----------------------------------------------------------------------------------

create policy "Anyone can read published content"
  on public.site_content for select
  to anon, authenticated
  using (id = 'published');

create policy "Admins can read all content"
  on public.site_content for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update the draft"
  on public.site_content for update
  to authenticated
  using (id = 'draft' and (select public.is_admin()))
  with check (id = 'draft' and (select public.is_admin()));

create policy "Admins can read content versions"
  on public.content_versions for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can read admins"
  on public.admins for select
  to authenticated
  using ((select public.is_admin()));

-- Storage -----------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 10485760, array['image/webp', 'image/jpeg', 'image/png']);

-- Public reads go through the public object URL and need no policy. Storage needs SELECT for
-- upserts, overwrites and removals, so admins get it too.
create policy "Admins can read site images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admins can upload site images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admins can update site images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()))
  with check (bucket_id = 'site-images' and (select public.is_admin()));

create policy "Admins can delete site images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));
