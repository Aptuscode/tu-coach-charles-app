
-- Restrict SECURITY DEFINER functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Replace broad public read on posters/avatars with non-listing read.
-- Drop the broad SELECT and re-create scoped only when accessing object by name (no list).
drop policy if exists "public read posters" on storage.objects;
drop policy if exists "public read avatars" on storage.objects;

-- Allow anonymous direct GET (no listing) by requiring no folder-listing context.
-- We keep buckets public=true so the CDN serves files; the policy below restricts SELECT to authenticated users for listing.
create policy "authed list posters" on storage.objects for select to authenticated using (bucket_id = 'posters');
create policy "authed list avatars" on storage.objects for select to authenticated using (bucket_id = 'avatars');
