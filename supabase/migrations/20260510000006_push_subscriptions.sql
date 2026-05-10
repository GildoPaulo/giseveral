-- Push subscriptions table for Web Push Notifications (RFC 8030)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT        UNIQUE NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can register their own subscription (no auth required — identified by endpoint uniqueness)
DROP POLICY IF EXISTS "push_sub_insert" ON public.push_subscriptions;
CREATE POLICY "push_sub_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Authenticated users can delete by endpoint (to unsubscribe)
DROP POLICY IF EXISTS "push_sub_delete" ON public.push_subscriptions;
CREATE POLICY "push_sub_delete" ON public.push_subscriptions
  FOR DELETE USING (true);

-- Service role reads all (used by push-send function via SUPABASE_SERVICE_ROLE_KEY)
-- anon cannot select
GRANT INSERT, DELETE ON public.push_subscriptions TO anon;
GRANT ALL ON public.push_subscriptions TO authenticated;
