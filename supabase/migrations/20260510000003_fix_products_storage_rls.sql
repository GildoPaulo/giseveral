-- ============================================================
-- Fix products table RLS + storage bucket policies
-- Fix hub_scholarships views increment (atomic, no race condition)
-- Fix hub_exams file_url column (ensure it exists)
-- ============================================================

-- ── 1. products — allow admin/staff to manage ──────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read"  ON public.products;
DROP POLICY IF EXISTS "products_auth_manage"  ON public.products;

-- Anyone can see active products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (active = true);

-- Authenticated (admin in practice) can do everything
CREATE POLICY "products_auth_manage" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- ── 2. product_categories ─────────────────────────────────────────────────────
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_public_read" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_auth_manage" ON public.product_categories;

CREATE POLICY "product_categories_public_read" ON public.product_categories
  FOR SELECT USING (true);

CREATE POLICY "product_categories_auth_manage" ON public.product_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;

-- ── 3. Storage bucket policies for 'images' ──────────────────────────────────
-- Make bucket public so uploaded images are accessible via public URL
UPDATE storage.buckets SET public = true WHERE id = 'images';

-- Policies live on storage.objects, not storage.policies
DROP POLICY IF EXISTS "images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "images_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "images_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "images_auth_delete"   ON storage.objects;

CREATE POLICY "images_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'images');

CREATE POLICY "images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'images');

-- ── 4. hub_scholarships — atomic views increment ──────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_scholarship_views(scholarship_id TEXT)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.hub_scholarships SET views = COALESCE(views, 0) + 1 WHERE id::text = scholarship_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_scholarship_views(TEXT) TO anon, authenticated;

-- ── 5. hub_scholarships — add edital_url column if missing ────────────────────
ALTER TABLE public.hub_scholarships ADD COLUMN IF NOT EXISTS edital_url TEXT;

-- ── 6. hub_exams — ensure file_url and related columns exist ──────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_exams') THEN
    ALTER TABLE public.hub_exams ADD COLUMN IF NOT EXISTS file_url TEXT;
    ALTER TABLE public.hub_exams ADD COLUMN IF NOT EXISTS solution_url TEXT;
  END IF;
END $$;

-- ── 7. prices table (for admin-managed pricing) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.prices (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT        NOT NULL DEFAULT 'Geral',
  name        TEXT        NOT NULL,
  price       NUMERIC,
  price_label TEXT        NOT NULL DEFAULT 'Orçamento',
  unit        TEXT        NOT NULL DEFAULT 'un',
  description TEXT,
  highlight   BOOLEAN     NOT NULL DEFAULT false,
  active      BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prices_public_read" ON public.prices;
DROP POLICY IF EXISTS "prices_auth_manage" ON public.prices;

CREATE POLICY "prices_public_read" ON public.prices
  FOR SELECT USING (active = true);

CREATE POLICY "prices_auth_manage" ON public.prices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prices TO authenticated;

DROP TRIGGER IF EXISTS prices_updated_at ON public.prices;
CREATE TRIGGER prices_updated_at
  BEFORE UPDATE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 8. hub_news — full admin table (ensure content_rich column exists) ─────────
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS content_rich TEXT;
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS author       TEXT NOT NULL DEFAULT 'Equipa Giseveral';
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS views        INT  NOT NULL DEFAULT 0;
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS published    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT true;
