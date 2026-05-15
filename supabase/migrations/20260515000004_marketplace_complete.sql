-- ============================================================
-- Marketplace foundation: categories enriched, subcategories,
-- seller profiles, customer profiles, chat, reviews.
-- Existing tables: product_categories (kept), products.
-- ============================================================

-- ── 1. product_categories: banner + icon + sort ────────────────
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS icon_name  TEXT;
-- `active` and `sort_order` already exist on product_categories.

-- ── 2. product_subcategories ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_subcategories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  active       BOOLEAN NOT NULL DEFAULT true,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_subcategories_category_idx
  ON public.product_subcategories (category_id, active, sort_order);

ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read subcategories" ON public.product_subcategories;
CREATE POLICY "Public read subcategories" ON public.product_subcategories
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Staff manage subcategories" ON public.product_subcategories;
CREATE POLICY "Staff manage subcategories" ON public.product_subcategories
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT ON public.product_subcategories TO anon, authenticated;
GRANT ALL ON public.product_subcategories TO authenticated;

DROP TRIGGER IF EXISTS product_subcategories_updated_at ON public.product_subcategories;
CREATE TRIGGER product_subcategories_updated_at
  BEFORE UPDATE ON public.product_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. seller_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name       TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  logo_url        TEXT,
  banner_url      TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  email           TEXT,
  location        TEXT,
  city            TEXT NOT NULL DEFAULT 'Beira',
  country         TEXT NOT NULL DEFAULT 'Moçambique',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  verified        BOOLEAN NOT NULL DEFAULT false,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_sales     INT NOT NULL DEFAULT 0,
  total_products  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_profiles_status_idx ON public.seller_profiles (status, verified DESC, rating DESC);
CREATE INDEX IF NOT EXISTS seller_profiles_slug_idx   ON public.seller_profiles (slug);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active sellers" ON public.seller_profiles;
CREATE POLICY "Public read active sellers" ON public.seller_profiles
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users see own seller profile" ON public.seller_profiles;
CREATE POLICY "Users see own seller profile" ON public.seller_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own seller" ON public.seller_profiles;
CREATE POLICY "Users insert own seller" ON public.seller_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own seller" ON public.seller_profiles;
CREATE POLICY "Users update own seller" ON public.seller_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff manage sellers" ON public.seller_profiles;
CREATE POLICY "Staff manage sellers" ON public.seller_profiles
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT ON public.seller_profiles TO anon, authenticated;
GRANT ALL ON public.seller_profiles TO authenticated;

DROP TRIGGER IF EXISTS seller_profiles_updated_at ON public.seller_profiles;
CREATE TRIGGER seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for seller assets (logos + banners).
INSERT INTO storage.buckets (id, name, public)
  VALUES ('seller-assets', 'seller-assets', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read seller assets" ON storage.objects;
CREATE POLICY "Public read seller assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'seller-assets');

DROP POLICY IF EXISTS "Users upload own seller assets" ON storage.objects;
CREATE POLICY "Users upload own seller assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'seller-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own seller assets" ON storage.objects;
CREATE POLICY "Users update own seller assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'seller-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own seller assets" ON storage.objects;
CREATE POLICY "Users delete own seller assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'seller-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Staff manage seller assets" ON storage.objects;
CREATE POLICY "Staff manage seller assets" ON storage.objects
  FOR ALL USING (bucket_id = 'seller-assets' AND public.is_staff())
  WITH CHECK (bucket_id = 'seller-assets' AND public.is_staff());

-- ── 4. products: marketplace columns ───────────────────────────
-- discount_percent, seller_name, rating, review_count, sales_count already exist
-- from migration 20260515000001_marketplace_fields.sql.
-- seller_id currently FKs auth.users(id) — drop it and re-point to seller_profiles(id).

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seller_id_fkey;

-- Clear stale user-ids so the new FK doesn't fail.
UPDATE public.products SET seller_id = NULL WHERE seller_id IS NOT NULL;

ALTER TABLE public.products
  ADD CONSTRAINT products_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

-- New marketplace columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS banner_url  TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images      TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'in_stock'
  CHECK (availability IN ('in_stock','pre_order','out_of_stock','negotiable'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.product_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_seller_idx2     ON public.products (seller_id, active);
CREATE INDEX IF NOT EXISTS products_featured_idx    ON public.products (is_featured DESC, created_at DESC) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_availability_idx ON public.products (availability) WHERE active = true;
CREATE INDEX IF NOT EXISTS products_subcategory_idx ON public.products (subcategory_id) WHERE subcategory_id IS NOT NULL;

-- Convenience trigger: keep seller_name in sync with the seller_profiles.shop_name.
CREATE OR REPLACE FUNCTION public.sync_product_seller_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF NEW.seller_id IS NULL THEN
    NEW.seller_name := COALESCE(NEW.seller_name, 'Giseveral Store');
    RETURN NEW;
  END IF;
  SELECT shop_name INTO v_name FROM public.seller_profiles WHERE id = NEW.seller_id;
  IF v_name IS NOT NULL THEN
    NEW.seller_name := v_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_seller_name_sync ON public.products;
CREATE TRIGGER products_seller_name_sync
  BEFORE INSERT OR UPDATE OF seller_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_seller_name();

-- ── 5. customer_profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  country     TEXT NOT NULL DEFAULT 'Moçambique',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own customer profile" ON public.customer_profiles;
CREATE POLICY "Users manage own customer profile" ON public.customer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff read customer profiles" ON public.customer_profiles;
CREATE POLICY "Staff read customer profiles" ON public.customer_profiles
  FOR SELECT USING (public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_profiles TO authenticated;

DROP TRIGGER IF EXISTS customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. seller_messages (1-to-1 chat) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_messages_thread_idx
  ON public.seller_messages (seller_id, customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_messages_unread_idx
  ON public.seller_messages (seller_id, read) WHERE read = false;

ALTER TABLE public.seller_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat participants read" ON public.seller_messages;
CREATE POLICY "Chat participants read" ON public.seller_messages
  FOR SELECT USING (
    auth.uid() = customer_id
    OR auth.uid() = (SELECT user_id FROM public.seller_profiles WHERE id = seller_id)
  );

DROP POLICY IF EXISTS "Chat participants insert" ON public.seller_messages;
CREATE POLICY "Chat participants insert" ON public.seller_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      auth.uid() = customer_id
      OR auth.uid() = (SELECT user_id FROM public.seller_profiles WHERE id = seller_id)
    )
  );

DROP POLICY IF EXISTS "Recipient marks read" ON public.seller_messages;
CREATE POLICY "Recipient marks read" ON public.seller_messages
  FOR UPDATE USING (
    auth.uid() = customer_id
    OR auth.uid() = (SELECT user_id FROM public.seller_profiles WHERE id = seller_id)
  );

DROP POLICY IF EXISTS "Staff read all chats" ON public.seller_messages;
CREATE POLICY "Staff read all chats" ON public.seller_messages
  FOR SELECT USING (public.is_staff());

GRANT SELECT, INSERT, UPDATE ON public.seller_messages TO authenticated;

-- ── 7. product_reviews ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  images      TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_idx
  ON public.product_reviews (product_id, created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews" ON public.product_reviews;
CREATE POLICY "Public read reviews" ON public.product_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own review" ON public.product_reviews;
CREATE POLICY "Users manage own review" ON public.product_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff manage reviews" ON public.product_reviews;
CREATE POLICY "Staff manage reviews" ON public.product_reviews
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;

-- Recalculate the parent product's aggregate rating / review_count.
CREATE OR REPLACE FUNCTION public.recalc_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pid UUID;
BEGIN
  v_pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products
    SET rating       = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.product_reviews WHERE product_id = v_pid), 0),
        review_count = (SELECT COUNT(*) FROM public.product_reviews WHERE product_id = v_pid)
    WHERE id = v_pid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS product_reviews_rating_sync ON public.product_reviews;
CREATE TRIGGER product_reviews_rating_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalc_product_rating();

-- ── 8. Seed: a few subcategories so the UI is not empty ───────
INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Portáteis',         'portateis',         1 FROM public.product_categories WHERE slug = 'formatacao-pc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Reparação',         'reparacao',         2 FROM public.product_categories WHERE slug = 'formatacao-pc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Acessórios',        'acessorios-pc',     3 FROM public.product_categories WHERE slug = 'formatacao-pc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Software',          'software',          4 FROM public.product_categories WHERE slug = 'formatacao-pc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Logos',              'logos-design',     1 FROM public.product_categories WHERE slug = 'design-grafico'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Cartões de visita', 'cartoes-visita',    2 FROM public.product_categories WHERE slug = 'design-grafico'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, slug, sort_order)
SELECT id, 'Flyers / Cartazes', 'flyers-cartazes',   3 FROM public.product_categories WHERE slug = 'design-grafico'
ON CONFLICT (slug) DO NOTHING;
