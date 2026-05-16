-- ============================================================
-- Human + AI revision system
-- Tracks user feedback on AI outputs and human-review requests.
-- ============================================================

-- ── 1. ai_feedback — lightweight thumbs up/down log ─────────────
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type   TEXT NOT NULL CHECK (source_type IN ('cv','letter','ats','scholarship','news','blog','chat','other')),
  source_ref    TEXT,
  rating        TEXT NOT NULL CHECK (rating IN ('up','down')),
  comment       TEXT,
  prompt_sample TEXT,
  output_sample TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_feedback_source_idx ON public.ai_feedback (source_type, rating, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_feedback_user_idx   ON public.ai_feedback (user_id, created_at DESC);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone insert feedback" ON public.ai_feedback;
CREATE POLICY "Anyone insert feedback" ON public.ai_feedback
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users see own feedback" ON public.ai_feedback;
CREATE POLICY "Users see own feedback" ON public.ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff see all feedback" ON public.ai_feedback;
CREATE POLICY "Staff see all feedback" ON public.ai_feedback
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT, INSERT ON public.ai_feedback TO anon, authenticated;

-- ── 2. revision_requests — human review queue ────────────────────
CREATE TABLE IF NOT EXISTS public.revision_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What is being revised
  source_type       TEXT NOT NULL CHECK (source_type IN ('cv','letter','scholarship','news','blog','document','other')),
  source_ref        TEXT,                   -- e.g. hub_documents.id, letter_templates.id
  source_title      TEXT,                   -- human-readable label for admin

  -- Content snapshot at request time
  original_content  TEXT NOT NULL,          -- the AI output the user disliked
  prompt_snapshot   TEXT,                   -- the prompt that produced it
  metadata          JSONB NOT NULL DEFAULT '{}',  -- tom, template, fields, etc.

  -- User feedback
  feedback_reason   TEXT,
  contact_phone     TEXT,
  contact_email     TEXT,
  contact_whatsapp  TEXT,

  -- Workflow
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_review','completed','cancelled')),
  plan_tier         TEXT NOT NULL DEFAULT 'free'
                    CHECK (plan_tier IN ('free','professional','premium')),
  priority          INT  NOT NULL DEFAULT 0,
  assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Result
  revised_content   TEXT,
  reviewer_notes    TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at       TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revision_requests_status_idx
  ON public.revision_requests (status, priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS revision_requests_user_idx
  ON public.revision_requests (user_id, created_at DESC);

ALTER TABLE public.revision_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own revision" ON public.revision_requests;
CREATE POLICY "Users insert own revision" ON public.revision_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users see own revisions" ON public.revision_requests;
CREATE POLICY "Users see own revisions" ON public.revision_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users cancel own revision" ON public.revision_requests;
CREATE POLICY "Users cancel own revision" ON public.revision_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));

DROP POLICY IF EXISTS "Staff manage revisions" ON public.revision_requests;
CREATE POLICY "Staff manage revisions" ON public.revision_requests
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT, INSERT, UPDATE ON public.revision_requests TO authenticated;

DROP TRIGGER IF EXISTS revision_requests_updated_at ON public.revision_requests;
CREATE TRIGGER revision_requests_updated_at
  BEFORE UPDATE ON public.revision_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. revision_comments — Google-Docs-style threaded comments ──
CREATE TABLE IF NOT EXISTS public.revision_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id   UUID NOT NULL REFERENCES public.revision_requests(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  anchor        TEXT,                    -- optional: text fragment / section ref
  resolved      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revision_comments_revision_idx
  ON public.revision_comments (revision_id, created_at);

ALTER TABLE public.revision_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read comments" ON public.revision_comments;
CREATE POLICY "Participants read comments" ON public.revision_comments
  FOR SELECT USING (
    auth.uid() = author_id
    OR auth.uid() = (SELECT user_id FROM public.revision_requests WHERE id = revision_id)
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "Participants insert comments" ON public.revision_comments;
CREATE POLICY "Participants insert comments" ON public.revision_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND (
      auth.uid() = (SELECT user_id FROM public.revision_requests WHERE id = revision_id)
      OR public.is_staff()
    )
  );

DROP POLICY IF EXISTS "Staff manage all comments" ON public.revision_comments;
CREATE POLICY "Staff manage all comments" ON public.revision_comments
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revision_comments TO authenticated;
