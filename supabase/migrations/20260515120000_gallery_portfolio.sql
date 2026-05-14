-- Portfolio: gallery_projects + gallery_images (+ optional link column on services)

CREATE TABLE IF NOT EXISTS public.gallery_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT,
  client_testimonial TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  challenge TEXT,
  solution TEXT,
  results TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  project_url TEXT,
  project_date DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.gallery_projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  step_order INT NOT NULL DEFAULT 0,
  step_label TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_projects_category ON public.gallery_projects(category, is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_projects_featured ON public.gallery_projects(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_images_project ON public.gallery_images(project_id, step_order);

ALTER TABLE public.gallery_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery_projects" ON public.gallery_projects;
DROP POLICY IF EXISTS "Auth manage gallery_projects" ON public.gallery_projects;
CREATE POLICY "Public read gallery_projects" ON public.gallery_projects
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');
CREATE POLICY "Auth manage gallery_projects" ON public.gallery_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Auth manage gallery_images" ON public.gallery_images;
CREATE POLICY "Public read gallery_images" ON public.gallery_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gallery_projects p
      WHERE p.id = project_id AND (p.is_active = true OR auth.role() = 'authenticated')
    )
  );
CREATE POLICY "Auth manage gallery_images" ON public.gallery_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.gallery_projects TO anon, authenticated;
GRANT ALL ON public.gallery_projects TO authenticated;
GRANT SELECT ON public.gallery_images TO anon, authenticated;
GRANT ALL ON public.gallery_images TO authenticated;

DROP TRIGGER IF EXISTS gallery_projects_updated_at ON public.gallery_projects;
CREATE TRIGGER gallery_projects_updated_at
  BEFORE UPDATE ON public.gallery_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Optional curated image ids per service row (for future admin use)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS gallery_images UUID[] NOT NULL DEFAULT '{}';

-- One-time copy from legacy gallery_items (same UUID as project id = 1 item -> 1 project)
INSERT INTO public.gallery_projects (
  id, title, slug, client_name, description, category, project_url, project_date,
  is_featured, is_active, created_at, updated_at
)
SELECT
  gi.id,
  gi.title,
  'proj-' || replace(gi.id::text, '-', ''),
  NULLIF(trim(gi.client), ''),
  COALESCE(NULLIF(trim(gi.description), ''), gi.title),
  CASE
    WHEN lower(trim(gi.category)) ~ '(impress|reprog|fotoc)' THEN 'impressao'
    WHEN lower(trim(gi.category)) ~ '(inform|assist|pc|comput)' THEN 'informatica'
    WHEN lower(trim(gi.category)) ~ '(rede|wifi|lan|router)' THEN 'informatica'
    WHEN lower(trim(gi.category)) ~ '(design|graf)' THEN 'design'
    WHEN lower(trim(gi.category)) ~ '(papel|escolar|escrit)' THEN 'papelaria'
    WHEN lower(trim(gi.category)) ~ '(cv|curric)' THEN 'cv'
    ELSE 'design'
  END,
  NULLIF(trim(gi.project_url), ''),
  (gi.created_at AT TIME ZONE 'UTC')::date,
  false,
  true,
  gi.created_at,
  gi.created_at
FROM public.gallery_items gi
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_projects gp WHERE gp.id = gi.id);

INSERT INTO public.gallery_images (
  project_id, image_url, title, description, step_order, step_label, is_cover
)
SELECT
  gi.id,
  gi.url,
  gi.title,
  NULLIF(trim(gi.description), ''),
  0,
  'Destaque',
  true
FROM public.gallery_items gi
WHERE EXISTS (SELECT 1 FROM public.gallery_projects p WHERE p.id = gi.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.gallery_images img
    WHERE img.project_id = gi.id AND img.is_cover = true
  );

INSERT INTO public.gallery_images (
  project_id, image_url, step_order, step_label, is_cover, title
)
SELECT
  gi.id,
  trim(gi.before_url),
  -1,
  'Antes',
  false,
  'Antes'
FROM public.gallery_items gi
WHERE gi.before_url IS NOT NULL
  AND trim(gi.before_url) <> ''
  AND EXISTS (SELECT 1 FROM public.gallery_projects p WHERE p.id = gi.id);
