-- Marketplace fields for multi-vendor storefront, flash sales & ratings.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_name TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 0
    CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0
    CHECK (review_count >= 0);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sales_count INT NOT NULL DEFAULT 0
    CHECK (sales_count >= 0);

CREATE INDEX IF NOT EXISTS products_discount_idx ON public.products (discount_percent DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_rating_idx ON public.products (rating DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_seller_idx ON public.products (seller_id) WHERE seller_id IS NOT NULL;

-- Default seller for existing rows (the in-house Giseveral store).
UPDATE public.products
  SET seller_name = 'Giseveral Store'
  WHERE seller_name IS NULL;
