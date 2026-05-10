-- Newsletter campaigns log
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      TEXT        NOT NULL,
  body_html    TEXT        NOT NULL,
  sent_to      INT         NOT NULL DEFAULT 0,
  failed       INT         NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'sent', -- sent | failed | partial
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_campaigns_staff_all" ON public.newsletter_campaigns
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  );

GRANT SELECT, INSERT ON public.newsletter_campaigns TO authenticated;

-- Make newsletter_subscribers readable by staff
DROP POLICY IF EXISTS "newsletter_subscribers_staff_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_staff_read" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  );

-- Allow anyone to delete their own subscription (unsubscribe)
DROP POLICY IF EXISTS "newsletter_subscribers_self_delete" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_self_delete" ON public.newsletter_subscribers
  FOR DELETE USING (true);
