# Admin deploy checklist

Going from local to a remote Supabase project plus Netlify. Run commands in `website/`.

1. Create the Supabase project (dashboard).
2. `supabase link --project-ref <ref>`, then `supabase db push`. This applies `supabase/migrations/*_site_content.sql` (tables `site_content`, `content_versions`, `admins`; functions `publish_draft`, `discard_draft`, `is_admin`; bucket `site-images`).
   Note: anon can execute `public.is_admin()`. It is harmless (returns false), left as is.
3. In the dashboard (Authentication), match `supabase/config.toml`: sign-ups off, email confirmations off, secure password change off.
4. Seed: put the remote values in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and the real `ADMIN_EMAIL` / `ADMIN_PASSWORD`), then `npm run seed:content`. It is idempotent: it creates the admin user and `admins` row, and inserts draft/published from the defaults only if missing.
   `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` are for the seed script only. Never set them on Netlify.
5. Netlify: set the site's base directory to `website` (so `netlify/functions` is found), and set env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (plus `NEXT_PUBLIC_SITE_URL`). Set the Netlify build Node version to 22 (`@netlify/functions` requires node >=22.12), e.g. env var `NODE_VERSION=22`.
6. Deploy.
7. Spike check: edit a price in `/admin`, Publish, and confirm the live page shows it within seconds. Publish calls `updateTag("site-content")` in `app/(admin)/admin/actions.ts`. If the page does not refresh, switch that call to `revalidateTag(CONTENT_TAG, { expire: 0 })` (`CONTENT_TAG` is in `lib/content/published.ts`).
8. Confirm an uploaded Storage image renders through the Netlify Image CDN.
9. Confirm in Netlify (Functions) that the scheduled function `keep-alive` ran. It pings Supabase daily so the free project is not paused.
10. Reset the admin password: Supabase dashboard -> Authentication -> Users -> the admin -> set a new password (no email is configured).
11. Roll back to an earlier version (SQL editor). Find the version, then restore it:

```sql
select id, published_at from public.content_versions order by id desc limit 10;

update public.site_content
set content = (select content from public.content_versions where id = <version id>),
    updated_at = now()
where id in ('published', 'draft');
```

Default: roll back both rows (as above), then Publish from the admin to refresh the cache; this is safe because draft and published are identical.

If you roll back only `published` (drop `'draft'` from the list), do NOT publish from the admin: `publish_draft()` copies the draft over `published` and undoes the rollback. Redeploy instead. The site's cached content is only invalidated by Publish (`updateTag`) or a redeploy.
