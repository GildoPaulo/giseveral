-- Add role/device_name to push_subscriptions for segmented sending
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS role        TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS device_name TEXT;

-- Push notifications history log
CREATE TABLE IF NOT EXISTS public.push_notifications_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  url            TEXT        NOT NULL DEFAULT '/',
  target_type    TEXT        NOT NULL DEFAULT 'all',  -- 'all' | 'admins' | 'students' | 'user'
  target_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_count     INT         NOT NULL DEFAULT 0,
  failed_count   INT         NOT NULL DEFAULT 0,
  removed_count  INT         NOT NULL DEFAULT 0,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;

-- Admins can read the history
DROP POLICY IF EXISTS "push_log_admin_select" ON public.push_notifications_log;
CREATE POLICY "push_log_admin_select" ON public.push_notifications_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON public.push_notifications_log TO authenticated;
GRANT ALL    ON public.push_notifications_log TO service_role;
