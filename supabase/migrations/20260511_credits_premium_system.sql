-- ============================================================
-- Credits & Premium system extensions
-- ============================================================

-- 1. Extend profiles with premium_expires_at + total_downloads
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_downloads     INTEGER NOT NULL DEFAULT 0;

-- 2. Credits transactions log
CREATE TABLE IF NOT EXISTS public.credits_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER     NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'admin',
  description TEXT        NOT NULL DEFAULT '',
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits_tx_own_select" ON public.credits_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credits_tx_staff_all" ON public.credits_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  );

GRANT SELECT ON public.credits_transactions TO authenticated;

-- 3. Promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'credits',
  value       INTEGER     NOT NULL DEFAULT 0,
  code        TEXT        UNIQUE,
  starts_at   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  max_uses    INTEGER,
  uses_count  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  conditions  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_public_select" ON public.promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "promotions_staff_all" ON public.promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  );

GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credits_transactions TO authenticated;
