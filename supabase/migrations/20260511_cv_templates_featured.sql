-- Add is_featured to cv_templates for "Recomendados" section
ALTER TABLE public.cv_templates
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
