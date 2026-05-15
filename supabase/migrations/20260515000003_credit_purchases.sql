-- Credit purchase requests (M-Pesa / Mkesh / E-Mola).
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_amount  INT NOT NULL CHECK (credits_amount > 0),
  price_mzn       NUMERIC(10,2) NOT NULL CHECK (price_mzn > 0),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('mpesa','mkesh','emola')),
  reference_code  TEXT NOT NULL UNIQUE,
  proof_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes     TEXT,
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_purchases_status_idx ON public.credit_purchases (status, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_purchases_user_idx   ON public.credit_purchases (user_id, created_at DESC);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own credit purchases" ON public.credit_purchases;
CREATE POLICY "Users see own credit purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own credit purchases" ON public.credit_purchases;
CREATE POLICY "Users insert own credit purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff manage credit purchases" ON public.credit_purchases;
CREATE POLICY "Staff manage credit purchases" ON public.credit_purchases
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT, INSERT ON public.credit_purchases TO authenticated;
GRANT ALL ON public.credit_purchases TO authenticated;

DROP TRIGGER IF EXISTS credit_purchases_updated_at ON public.credit_purchases;
CREATE TRIGGER credit_purchases_updated_at
  BEFORE UPDATE ON public.credit_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('payment-proofs', 'payment-proofs', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload own proof" ON storage.objects;
CREATE POLICY "Users upload own proof" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users read own proof" ON storage.objects;
CREATE POLICY "Users read own proof" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Staff read all proofs" ON storage.objects;
CREATE POLICY "Staff read all proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND public.is_staff());

-- Approve helper: bumps user balance atomically.
CREATE OR REPLACE FUNCTION public.approve_credit_purchase(p_purchase_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS public.credit_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.credit_purchases;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Apenas staff pode aprovar.';
  END IF;

  SELECT * INTO v_row FROM public.credit_purchases WHERE id = p_purchase_id FOR UPDATE;
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;
  IF v_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Apenas pedidos pendentes podem ser aprovados.';
  END IF;

  UPDATE public.profiles
    SET hub_credits = hub_credits + v_row.credits_amount
    WHERE id = v_row.user_id;

  UPDATE public.credit_purchases
    SET status = 'approved',
        admin_notes = COALESCE(p_notes, admin_notes),
        approved_by = auth.uid(),
        approved_at = NOW()
    WHERE id = p_purchase_id
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_credit_purchase(p_purchase_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS public.credit_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.credit_purchases;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Apenas staff pode rejeitar.';
  END IF;

  UPDATE public.credit_purchases
    SET status = 'rejected',
        admin_notes = COALESCE(p_notes, admin_notes),
        approved_by = auth.uid(),
        approved_at = NOW()
    WHERE id = p_purchase_id AND status = 'pending'
    RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado ou já processado.';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_credit_purchase(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_credit_purchase(UUID, TEXT) TO authenticated;
