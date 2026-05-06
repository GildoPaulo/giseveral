-- Add cover_image_url column to hub_documents
-- Allows document cards to show a real cover image instead of the procedural gradient.

ALTER TABLE public.hub_documents
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
