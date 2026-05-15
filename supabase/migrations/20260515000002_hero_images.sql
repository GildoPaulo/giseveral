-- Hero images managed by staff via /balcao/hero
CREATE TABLE IF NOT EXISTS public.hero_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  subtitle    TEXT,
  cta_label   TEXT,
  cta_url     TEXT,
  image_url   TEXT NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  page        TEXT NOT NULL DEFAULT 'home' CHECK (page IN ('home', 'loja', 'servicos')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hero_images_page_active_idx
  ON public.hero_images (page, active, position);

ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read hero images" ON public.hero_images;
CREATE POLICY "Public read hero images" ON public.hero_images
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Staff manage hero images" ON public.hero_images;
CREATE POLICY "Staff manage hero images" ON public.hero_images
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT ON public.hero_images TO anon, authenticated;
GRANT ALL ON public.hero_images TO authenticated;

DROP TRIGGER IF EXISTS hero_images_updated_at ON public.hero_images;
CREATE TRIGGER hero_images_updated_at
  BEFORE UPDATE ON public.hero_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for hero uploads
INSERT INTO storage.buckets (id, name, public)
  VALUES ('hero-images', 'hero-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read hero objects" ON storage.objects;
CREATE POLICY "Public read hero objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Staff upload hero objects" ON storage.objects;
CREATE POLICY "Staff upload hero objects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hero-images' AND public.is_staff());

DROP POLICY IF EXISTS "Staff update hero objects" ON storage.objects;
CREATE POLICY "Staff update hero objects" ON storage.objects
  FOR UPDATE USING (bucket_id = 'hero-images' AND public.is_staff());

DROP POLICY IF EXISTS "Staff delete hero objects" ON storage.objects;
CREATE POLICY "Staff delete hero objects" ON storage.objects
  FOR DELETE USING (bucket_id = 'hero-images' AND public.is_staff());

-- Seed: use existing /public/images/ assets so admin starts with something.
INSERT INTO public.hero_images (title, subtitle, image_url, position, page, active) VALUES
  ('Técnico em redes',    'Instalação Wi-Fi e LAN',           '/images/hero-1.jpg', 1, 'home', true),
  ('Equipa Giseveral',    'Atendimento personalizado',         '/images/hero-2.jpg', 2, 'home', true),
  ('Serviços locais',     'Entrega no mesmo dia na Beira',     '/images/hero-3.jpg', 3, 'home', true),
  ('Reprografia premium', 'Impressão a cores e P&B',           '/images/hero-0.jpg', 4, 'home', true);

INSERT INTO public.hero_images (title, subtitle, cta_label, cta_url, image_url, position, page, active) VALUES
  ('Flash Sale — até 40%',    'Em impressão e design — só hoje',                     'Ver ofertas',       '#flash-sales',       '/images/hero-1.jpg', 1, 'loja', true),
  ('Marketplace aberto',      'Qualquer pessoa pode vender na Giseveral',            'Começar a vender',  '/vendedor/registar', '/images/hero-2.jpg', 2, 'loja', true),
  ('Entrega no mesmo dia',    'Impressão expressa, design rápido, TI ao domicílio', 'Pedir agora',       '/orcamento',         '/images/hero-3.jpg', 3, 'loja', true);
