-- ============================================================
-- Revision pricing (admin-editable) + payment flow on requests
-- ============================================================

-- ── 1. revision_pricing — table the admin manages from balcão ──
CREATE TABLE IF NOT EXISTS public.revision_pricing (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type      TEXT NOT NULL CHECK (source_type IN ('cv','letter','scholarship','news','blog','document','other')),
  tier             TEXT NOT NULL CHECK (tier IN ('free','professional','premium')),
  label            TEXT NOT NULL,
  description      TEXT,
  price_mzn        NUMERIC(10,2) NOT NULL DEFAULT 0,
  turnaround_hours INT NOT NULL DEFAULT 24,
  active           BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, tier)
);

CREATE INDEX IF NOT EXISTS revision_pricing_lookup_idx
  ON public.revision_pricing (source_type, active, sort_order);

ALTER TABLE public.revision_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pricing" ON public.revision_pricing;
CREATE POLICY "Public read pricing" ON public.revision_pricing
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Staff manage pricing" ON public.revision_pricing;
CREATE POLICY "Staff manage pricing" ON public.revision_pricing
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT ON public.revision_pricing TO anon, authenticated;
GRANT ALL ON public.revision_pricing TO authenticated;

DROP TRIGGER IF EXISTS revision_pricing_updated_at ON public.revision_pricing;
CREATE TRIGGER revision_pricing_updated_at
  BEFORE UPDATE ON public.revision_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults so the widget has something to show on day 1.
INSERT INTO public.revision_pricing (source_type, tier, label, description, price_mzn, turnaround_hours, sort_order) VALUES
  -- CV
  ('cv',          'free',         'IA Free',              'Análise automática e regeneração com IA.',                       0,    1, 1),
  ('cv',          'professional', 'Revisão Profissional', 'Um especialista revê o teu CV, sugere melhorias e optimiza ATS.', 350,  24, 2),
  ('cv',          'premium',      'CV Premium',           'CV reescrito de raiz com design profissional + carta opcional.',  900,  48, 3),

  -- Letter / Carta
  ('letter',      'free',         'IA Free',              'Geração e melhoria automática com IA.',                          0,    1, 1),
  ('letter',      'professional', 'Revisão Profissional', 'Um especialista revê e polir a tua carta.',                      250,  24, 2),
  ('letter',      'premium',      'Carta Premium',        'Carta personalizada feita por um especialista.',                  600,  48, 3),

  -- Scholarship / Bolsa
  ('scholarship', 'free',         'IA Free',              'Geração com IA.',                                                  0,    1, 1),
  ('scholarship', 'professional', 'Revisão Profissional', 'Revisão da candidatura por especialista.',                       350,  48, 2),

  -- Document
  ('document',    'free',         'IA Free',              'Auto-geração.',                                                    0,    1, 1),
  ('document',    'professional', 'Revisão Profissional', 'Revisão humana do documento.',                                   300,  48, 2)
ON CONFLICT (source_type, tier) DO NOTHING;

-- ── 2. revision_requests — extend with payment fields ──────────
ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS price_mzn NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IN ('mpesa','mkesh','emola','cash','transferencia') OR payment_method IS NULL);

ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE public.revision_requests
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','approved','rejected','waived'));

-- Free tier doesn't need payment — mark it as waived automatically.
UPDATE public.revision_requests
  SET payment_status = 'waived'
  WHERE plan_tier = 'free' AND payment_status = 'unpaid';

-- Status workflow gets a new "pending_payment" state.
DO $$ BEGIN
  ALTER TABLE public.revision_requests DROP CONSTRAINT IF EXISTS revision_requests_status_check;
  ALTER TABLE public.revision_requests
    ADD CONSTRAINT revision_requests_status_check
    CHECK (status IN ('pending_payment','pending','in_review','completed','cancelled'));
END $$;
