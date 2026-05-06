-- ============================================================
-- Giseveral – Fix admin role + ensure missing tables/bucket
-- ============================================================

-- --------------------------------------------------------
-- 1. GALLERY ITEMS (may not exist if 20260507000000 was skipped)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  client      TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'Outro',
  rating      INT  NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery"  ON public.gallery_items;
DROP POLICY IF EXISTS "Staff manage gallery" ON public.gallery_items;

CREATE POLICY "Public read gallery" ON public.gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Staff manage gallery" ON public.gallery_items
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- --------------------------------------------------------
-- 2. IMAGES BUCKET (public, 10 MB, images only)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images', 'images', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
DROP POLICY IF EXISTS "Public read images"   ON storage.objects;
DROP POLICY IF EXISTS "Staff upload images"  ON storage.objects;
DROP POLICY IF EXISTS "Staff delete images"  ON storage.objects;
DROP POLICY IF EXISTS "Staff update images"  ON storage.objects;

CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Staff upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images' AND public.is_staff());

CREATE POLICY "Staff delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND public.is_staff());

CREATE POLICY "Staff update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND public.is_staff());

-- --------------------------------------------------------
-- 3. ROBUST ADMIN PROMOTION — works even if profile.email is NULL
-- --------------------------------------------------------

-- 3a. Ensure profile exists for admin email (UPSERT)
INSERT INTO public.profiles (id, full_name, email, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email,
  'admin'
FROM auth.users u
WHERE u.email = 'gildopaulocorreia84@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role  = 'admin',
      email = EXCLUDED.email;

-- 3b. Also update by email match in profiles (belt-and-suspenders)
UPDATE public.profiles
SET role  = 'admin',
    email = u.email
FROM auth.users u
WHERE public.profiles.id = u.id
  AND u.email = 'gildopaulocorreia84@gmail.com';

-- --------------------------------------------------------
-- 4. Ensure profiles.email is populated for ALL existing users
--    (old handle_new_user didn't always save email)
-- --------------------------------------------------------
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL
  AND u.email IS NOT NULL;

-- --------------------------------------------------------
-- 5. FIX blog_posts SELECT — staff must see ALL posts, not just published
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage posts"         ON public.blog_posts;
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;

-- Staff sees and manages everything
CREATE POLICY "Staff manage posts" ON public.blog_posts
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Public sees only published posts
CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT USING (published = true AND NOT public.is_staff());

-- --------------------------------------------------------
-- 6. SERVICE-UPLOADS bucket — allow staff to upload images too
-- --------------------------------------------------------
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg','image/png','image/webp','image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
WHERE id = 'service-uploads';
