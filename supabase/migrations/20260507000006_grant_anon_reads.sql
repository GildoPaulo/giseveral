-- ============================================================
-- Giseveral – Grant SELECT to anon role on all public Hub/Blog tables
-- Without these GRANTs, Supabase blocks anon reads even when RLS allows it.
-- ============================================================

-- Hub tables
GRANT SELECT ON public.hub_documents    TO anon;
GRANT SELECT ON public.hub_scholarships TO anon;
GRANT SELECT ON public.hub_news         TO anon;
GRANT SELECT ON public.hub_exams        TO anon;

-- Blog & gallery
GRANT SELECT ON public.blog_posts       TO anon;
GRANT SELECT ON public.gallery_items    TO anon;

-- Campaigns (new table)
GRANT SELECT ON public.campaigns        TO anon;

-- --------------------------------------------------------
-- Ensure hub_exams table exists (create if missing)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_exams (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  institution         TEXT        NOT NULL DEFAULT '',
  course              TEXT        NOT NULL DEFAULT '',
  year                INT         NOT NULL DEFAULT 2024,
  subjects            TEXT[]      NOT NULL DEFAULT '{}',
  difficulty          TEXT        NOT NULL DEFAULT 'Médio' CHECK (difficulty IN ('Fácil','Médio','Difícil')),
  description         TEXT,
  featured            BOOLEAN     NOT NULL DEFAULT false,
  active              BOOLEAN     NOT NULL DEFAULT true,
  file_url            TEXT,
  solution_url        TEXT,
  allow_registrations BOOLEAN     NOT NULL DEFAULT false,
  registration_url    TEXT,
  registration_deadline TEXT,
  registration_fee    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_exams_select_public" ON public.hub_exams;
DROP POLICY IF EXISTS "hub_exams_auth_all"      ON public.hub_exams;

CREATE POLICY "hub_exams_select_public" ON public.hub_exams
  FOR SELECT USING (active = true);

CREATE POLICY "hub_exams_auth_all" ON public.hub_exams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.hub_exams TO anon;

-- --------------------------------------------------------
-- Re-confirm RLS policies allow anon reads without auth check
-- (replace "OR auth.role() = 'authenticated'" with just active/published)
-- --------------------------------------------------------

-- hub_scholarships: active = true (no auth check needed for reads)
DROP POLICY IF EXISTS "hub_scholarships_select_public" ON public.hub_scholarships;
CREATE POLICY "hub_scholarships_select_public" ON public.hub_scholarships
  FOR SELECT USING (active = true);

-- hub_news: published = true
DROP POLICY IF EXISTS "hub_news_select_published" ON public.hub_news;
CREATE POLICY "hub_news_select_published" ON public.hub_news
  FOR SELECT USING (published = true);

-- hub_documents: published = true
DROP POLICY IF EXISTS "hub_documents_select_published" ON public.hub_documents;
CREATE POLICY "hub_documents_select_published" ON public.hub_documents
  FOR SELECT USING (published = true);

-- campaigns: active = true
DROP POLICY IF EXISTS "Public read active campaigns" ON public.campaigns;
CREATE POLICY "Public read active campaigns" ON public.campaigns
  FOR SELECT USING (active = true);
