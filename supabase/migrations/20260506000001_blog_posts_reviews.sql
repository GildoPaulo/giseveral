-- ============================================================
-- Giseveral – Blog posts table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  category        TEXT NOT NULL DEFAULT 'Informática',
  image_url       TEXT,
  excerpt         TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  keywords        TEXT,
  content         JSONB NOT NULL DEFAULT '[]',
  published       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Staff manage posts" ON public.blog_posts
  FOR ALL USING (public.is_staff());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
