-- ============================================================
-- Hub documents v2 (Scribd-style)
-- Adds thumbnail/page_count/votes/bookmarks + supporting tables.
-- Keeps the existing bucket public for backward compat — the app
-- now uses signed URLs to render PDFs and never exposes the raw
-- URL in HTML.
-- ============================================================

ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT;
ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS page_count      INT NOT NULL DEFAULT 0;
ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS votes_up        INT NOT NULL DEFAULT 0;
ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS votes_down      INT NOT NULL DEFAULT 0;
ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS bookmarks_count INT NOT NULL DEFAULT 0;

-- Backfill page_count from the legacy `pages` column when zero.
UPDATE public.hub_documents
   SET page_count = COALESCE(pages, 0)
 WHERE page_count = 0 AND pages IS NOT NULL;

-- ── document_votes ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.hub_documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote         INT  NOT NULL CHECK (vote IN (1, -1)),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS document_votes_doc_idx ON public.document_votes (document_id);

ALTER TABLE public.document_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read votes" ON public.document_votes;
CREATE POLICY "Public read votes" ON public.document_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own vote" ON public.document_votes;
CREATE POLICY "Users manage own vote" ON public.document_votes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.document_votes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.document_votes TO authenticated;

-- ── document_bookmarks ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.hub_documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS document_bookmarks_user_idx ON public.document_bookmarks (user_id, created_at DESC);

ALTER TABLE public.document_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own bookmarks" ON public.document_bookmarks;
CREATE POLICY "Users see own bookmarks" ON public.document_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own bookmark" ON public.document_bookmarks;
CREATE POLICY "Users manage own bookmark" ON public.document_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_bookmarks TO authenticated;

-- ── Aggregate triggers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalc_doc_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_doc UUID;
BEGIN
  v_doc := COALESCE(NEW.document_id, OLD.document_id);
  UPDATE public.hub_documents
    SET votes_up   = (SELECT COUNT(*) FROM public.document_votes WHERE document_id = v_doc AND vote = 1),
        votes_down = (SELECT COUNT(*) FROM public.document_votes WHERE document_id = v_doc AND vote = -1)
    WHERE id = v_doc;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS document_votes_sync ON public.document_votes;
CREATE TRIGGER document_votes_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.document_votes
  FOR EACH ROW EXECUTE FUNCTION public.recalc_doc_votes();

CREATE OR REPLACE FUNCTION public.recalc_doc_bookmarks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_doc UUID;
BEGIN
  v_doc := COALESCE(NEW.document_id, OLD.document_id);
  UPDATE public.hub_documents
    SET bookmarks_count = (SELECT COUNT(*) FROM public.document_bookmarks WHERE document_id = v_doc)
    WHERE id = v_doc;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS document_bookmarks_sync ON public.document_bookmarks;
CREATE TRIGGER document_bookmarks_sync
  AFTER INSERT OR DELETE ON public.document_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.recalc_doc_bookmarks();
