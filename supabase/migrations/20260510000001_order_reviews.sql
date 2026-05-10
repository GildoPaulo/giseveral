-- ============================================================
-- order_reviews — avaliações de encomendas entregues
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_reviews (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, user_id)
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_reviews_public_read"  ON public.order_reviews;
DROP POLICY IF EXISTS "order_reviews_auth_manage"  ON public.order_reviews;

CREATE POLICY "order_reviews_public_read" ON public.order_reviews
  FOR SELECT USING (true);

CREATE POLICY "order_reviews_auth_manage" ON public.order_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                         ON public.order_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_reviews TO authenticated;
