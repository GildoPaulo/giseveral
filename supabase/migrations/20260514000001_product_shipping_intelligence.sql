-- Product-level intelligent shipping foundation.
-- Enables local, national, international and digital delivery calculations per product.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_cm INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_cm INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_cm INTEGER;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_type TEXT NOT NULL DEFAULT 'local'
  CHECK (shipping_type IN ('local', 'national', 'international', 'digital'));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_origin TEXT NOT NULL DEFAULT 'Beira, Mocambique';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS express_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS international_shipping_fee NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS products_shipping_type_idx ON public.products (shipping_type, active);
