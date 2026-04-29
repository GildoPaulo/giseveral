-- Add featured flag to products for homepage highlights
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Index for fast featured product queries
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products (featured, active) WHERE featured = true AND active = true;
