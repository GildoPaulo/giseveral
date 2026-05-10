-- Add before/after comparison and project URL to gallery items
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS before_url   TEXT,
  ADD COLUMN IF NOT EXISTS project_url  TEXT;
