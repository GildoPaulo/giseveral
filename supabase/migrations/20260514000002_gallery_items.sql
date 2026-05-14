-- Gallery items for homepage work showcase
-- Photos of real work: logos, printing, shirts, web design, etc.

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  -- Image info
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,

  -- Category for filtering
  category TEXT NOT NULL DEFAULT 'outros'
    CHECK (category IN ('logotipos', 'estampagem', 'impressao', 'web', 'cartazes', 'outros')),

  -- Display order
  display_order INT DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery_items(category, active);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON public.gallery_items(display_order, active);

-- RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Public read access for active items
CREATE POLICY "Anyone can view active gallery items"
  ON public.gallery_items FOR SELECT
  USING (active = true);

-- Admin full access
CREATE POLICY "Admins can manage gallery items"
  ON public.gallery_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant access
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT ALL ON public.gallery_items TO authenticated;
