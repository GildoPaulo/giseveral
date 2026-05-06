-- ============================================================
-- Giseveral – Galeria e bucket público de imagens
-- ============================================================

-- --------------------------------------------------------
-- GALLERY ITEMS
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

CREATE POLICY "Public read gallery" ON public.gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Staff manage gallery" ON public.gallery_items
  FOR ALL USING (public.is_staff());

-- --------------------------------------------------------
-- STORAGE BUCKET — imagens públicas (galeria, blog, hub)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Qualquer utilizador pode ver imagens públicas
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Só staff pode fazer upload
CREATE POLICY "Staff upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images' AND public.is_staff());

-- Só staff pode apagar
CREATE POLICY "Staff delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND public.is_staff());

-- Staff pode actualizar metadados
CREATE POLICY "Staff update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND public.is_staff());

-- Mover service-uploads para também aceitar imagens (JPG, PNG, WEBP)
-- (o bucket já existe — só actualiza os allowed_mime_types)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf','image/jpeg','image/png','image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
WHERE id = 'service-uploads';

-- Permitir que staff leia todos os ficheiros do service-uploads
DROP POLICY IF EXISTS "Staff can read all files" ON storage.objects;
CREATE POLICY "Staff can read all files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-uploads' AND public.is_staff()
  );

-- Permitir que o dono veja os seus ficheiros
DROP POLICY IF EXISTS "Owner can read own files" ON storage.objects;
CREATE POLICY "Owner can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-uploads'
  );
