-- ============================================================
-- Giseveral – Campaigns table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  active         BOOLEAN     NOT NULL DEFAULT true,
  type           TEXT        NOT NULL CHECK (type IN ('banner', 'slider', 'mini', 'popup')),
  title          TEXT        NOT NULL DEFAULT '',
  subtitle       TEXT        NOT NULL DEFAULT '',
  description    TEXT        NOT NULL DEFAULT '',
  image_url      TEXT        NOT NULL DEFAULT '',
  cta_text       TEXT        NOT NULL DEFAULT 'Ver promoção',
  cta_url        TEXT        NOT NULL DEFAULT '/orcamento',
  urgency        TEXT        NOT NULL DEFAULT 'none' CHECK (urgency IN ('none', 'timer', 'stock', 'coupon')),
  urgency_value  TEXT        NOT NULL DEFAULT '',
  social_proof   TEXT        NOT NULL DEFAULT '',
  original_price TEXT        NOT NULL DEFAULT '',
  new_price      TEXT        NOT NULL DEFAULT '',
  savings_text   TEXT        NOT NULL DEFAULT '',
  starts_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Public can read active campaigns
CREATE POLICY "Public read active campaigns" ON public.campaigns
  FOR SELECT USING (active = true);

-- Staff can manage all campaigns
CREATE POLICY "Staff manage campaigns" ON public.campaigns
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
