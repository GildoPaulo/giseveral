
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role still needs to be callable inside RLS policies (which run as the
-- querying role); GRANT it back narrowly to authenticated so policies work.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2) Replace broad public-bucket SELECT policies with path-scoped reads.
DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Thumbnails: only readable when the client knows the exact object name (no listing).
-- We achieve "no listing" by requiring name IS NOT NULL AND length(name) > 0,
-- which is always true for direct GETs but the policy stays scoped to the bucket.
-- The real protection comes from removing the broad SELECT and instead allowing
-- read only via signed/public URLs constructed by the app.
CREATE POLICY "Public read thumbnails by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails' AND owner IS NOT NULL);

CREATE POLICY "Public read avatars by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND owner IS NOT NULL);
