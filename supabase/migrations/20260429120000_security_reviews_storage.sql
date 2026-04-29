
-- ============================================================
-- Giseveral – Segurança, Reviews e Storage
-- ============================================================

-- --------------------------------------------------------
-- has_role() — SECURITY DEFINER para evitar recursão em RLS
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

-- Actualizar policies existentes para usar is_staff() e evitar recursão
-- product_categories
DROP POLICY IF EXISTS "Admin manage categories" ON public.product_categories;
CREATE POLICY "Admin manage categories" ON public.product_categories
  FOR ALL USING (public.is_staff());

-- products
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products
  FOR ALL USING (public.is_staff());

-- delivery_zones
DROP POLICY IF EXISTS "Admin manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admin manage delivery zones" ON public.delivery_zones
  FOR ALL USING (public.is_staff());

-- orders
DROP POLICY IF EXISTS "Admin all orders" ON public.orders;
CREATE POLICY "Admin all orders" ON public.orders
  FOR ALL USING (public.is_staff());

-- order_items
DROP POLICY IF EXISTS "Admin all order items" ON public.order_items;
CREATE POLICY "Admin all order items" ON public.order_items
  FOR ALL USING (public.is_staff());

-- --------------------------------------------------------
-- REVIEWS — avaliações de produtos (fase 2)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  order_id    UUID REFERENCES public.orders(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users create review" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = reviews.product_id
        AND o.user_id = auth.uid()
        AND o.status = 'delivered'
    )
  );

CREATE POLICY "Users edit own review" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own review" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin manage reviews" ON public.reviews
  FOR ALL USING (public.is_staff());

-- --------------------------------------------------------
-- STORAGE BUCKET — ficheiros de serviços (impressão, design)
-- --------------------------------------------------------
-- Executa isto manualmente no Dashboard do Supabase → Storage → New bucket
-- Nome: service-uploads
-- Public: FALSE (privado)
--
-- Depois cria estas policies no bucket:
-- 1. Authenticated upload:
--    USING: auth.role() = 'authenticated'
-- 2. Owner read:
--    USING: auth.uid()::text = (storage.foldername(name))[1]
-- 3. Staff read all:
--    USING: public.is_staff()
--
-- OU usa o SQL abaixo se o Supabase Storage estiver disponível via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-uploads',
  'service-uploads',
  false,
  20971520, -- 20 MB
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-uploads');

CREATE POLICY "Owner can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Staff can read all files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'service-uploads' AND
    public.is_staff()
  );
