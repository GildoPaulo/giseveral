-- ============================================================
-- Giseveral — Letter Templates table for admin-managed templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.letter_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  icon        TEXT        NOT NULL DEFAULT '📄',
  category    TEXT        NOT NULL DEFAULT 'Geral',
  fields      JSONB       NOT NULL DEFAULT '[]',
  template    TEXT        NOT NULL DEFAULT '',
  active      BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "letter_templates_select_active" ON public.letter_templates;
DROP POLICY IF EXISTS "letter_templates_auth_all"       ON public.letter_templates;

CREATE POLICY "letter_templates_select_active" ON public.letter_templates
  FOR SELECT USING (active = true);

CREATE POLICY "letter_templates_auth_all" ON public.letter_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                          ON public.letter_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.letter_templates TO authenticated;

-- ── Auto-update updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS letter_templates_updated_at ON public.letter_templates;
CREATE TRIGGER letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── bolsa_applications missing column fix ──────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bolsa_applications') THEN
    ALTER TABLE public.bolsa_applications ADD COLUMN IF NOT EXISTS applications_count INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Ensure bolsa_comments table exists
CREATE TABLE IF NOT EXISTS public.bolsa_comments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id TEXT        NOT NULL,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id      UUID        REFERENCES public.bolsa_comments(id) ON DELETE CASCADE,
  content        TEXT        NOT NULL,
  author_name    TEXT        NOT NULL DEFAULT 'Utilizador',
  is_admin       BOOLEAN     NOT NULL DEFAULT false,
  helpful_count  INT         NOT NULL DEFAULT 0,
  approved       BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bolsa_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bolsa_comments_select_approved" ON public.bolsa_comments;
DROP POLICY IF EXISTS "bolsa_comments_insert_auth"     ON public.bolsa_comments;
DROP POLICY IF EXISTS "bolsa_comments_auth_all"        ON public.bolsa_comments;

CREATE POLICY "bolsa_comments_select_approved" ON public.bolsa_comments
  FOR SELECT USING (approved = true OR auth.role() = 'authenticated');

CREATE POLICY "bolsa_comments_insert_auth" ON public.bolsa_comments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "bolsa_comments_auth_all" ON public.bolsa_comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.bolsa_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bolsa_comments TO authenticated;

-- Ensure bolsa_applications table exists
CREATE TABLE IF NOT EXISTS public.bolsa_applications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id TEXT        NOT NULL,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL DEFAULT '',
  whatsapp       TEXT        NOT NULL,
  course         TEXT,
  university     TEXT,
  help_needed    TEXT[]      NOT NULL DEFAULT '{}',
  notes          TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bolsa_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bolsa_applications_insert_auth" ON public.bolsa_applications;
DROP POLICY IF EXISTS "bolsa_applications_auth_all"    ON public.bolsa_applications;

CREATE POLICY "bolsa_applications_insert_auth" ON public.bolsa_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "bolsa_applications_auth_all" ON public.bolsa_applications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON public.bolsa_applications TO authenticated;
