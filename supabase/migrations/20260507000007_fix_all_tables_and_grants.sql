-- ============================================================
-- GISEVERAL — Comprehensive fix: create missing tables + grants
-- Run this in Supabase SQL Editor if any of these tables are missing.
-- ============================================================

-- ── 1. hub_scholarships ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hub_scholarships (
  id                 TEXT        PRIMARY KEY,
  title              TEXT        NOT NULL,
  country            TEXT        NOT NULL DEFAULT '',
  flag               TEXT        NOT NULL DEFAULT '',
  level              TEXT        NOT NULL DEFAULT '',
  area               TEXT        NOT NULL DEFAULT '',
  coverage           TEXT        NOT NULL DEFAULT '',
  language           TEXT        NOT NULL DEFAULT 'Inglês',
  deadline           DATE        NOT NULL DEFAULT CURRENT_DATE,
  institution        TEXT        NOT NULL DEFAULT '',
  description        TEXT,
  apply_url          TEXT        NOT NULL DEFAULT '',
  benefits           TEXT[]      NOT NULL DEFAULT '{}',
  requirements       TEXT[]      NOT NULL DEFAULT '{}',
  process_steps      TEXT[]      NOT NULL DEFAULT '{}',
  documents          TEXT[]      NOT NULL DEFAULT '{}',
  tips               TEXT[]      NOT NULL DEFAULT '{}',
  featured           BOOLEAN     NOT NULL DEFAULT false,
  active             BOOLEAN     NOT NULL DEFAULT true,
  image_url          TEXT,
  content_rich       TEXT,
  guides             JSONB       NOT NULL DEFAULT '[]',
  materials          JSONB       NOT NULL DEFAULT '[]',
  views              INT         NOT NULL DEFAULT 0,
  comments_enabled   BOOLEAN     NOT NULL DEFAULT true,
  allow_applications BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_scholarships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_scholarships_select_public" ON public.hub_scholarships;
DROP POLICY IF EXISTS "hub_scholarships_auth_all"      ON public.hub_scholarships;
DROP POLICY IF EXISTS "scholarships_public_read"        ON public.hub_scholarships;
DROP POLICY IF EXISTS "scholarships_staff_all"          ON public.hub_scholarships;

CREATE POLICY "hub_scholarships_select_public" ON public.hub_scholarships
  FOR SELECT USING (active = true);

CREATE POLICY "hub_scholarships_auth_all" ON public.hub_scholarships
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                     ON public.hub_scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_scholarships TO authenticated;

-- ── 2. hub_news ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hub_news (
  id                     TEXT        PRIMARY KEY,
  title                  TEXT        NOT NULL,
  excerpt                TEXT,
  category               TEXT        NOT NULL DEFAULT 'Bolsas',
  author                 TEXT        NOT NULL DEFAULT 'Equipa Giseveral',
  date                   DATE        NOT NULL DEFAULT CURRENT_DATE,
  image_url              TEXT,
  content_rich           TEXT,
  content                TEXT[]      NOT NULL DEFAULT '{}',
  related_scholarship_id TEXT        REFERENCES public.hub_scholarships(id) ON DELETE SET NULL,
  tags                   TEXT[]      NOT NULL DEFAULT '{}',
  published              BOOLEAN     NOT NULL DEFAULT true,
  comments_enabled       BOOLEAN     NOT NULL DEFAULT true,
  views                  INT         NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add content_rich if the table already exists without it
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS content_rich TEXT;
ALTER TABLE public.hub_news ADD COLUMN IF NOT EXISTS image_url    TEXT;

ALTER TABLE public.hub_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_news_select_published" ON public.hub_news;
DROP POLICY IF EXISTS "hub_news_auth_all"          ON public.hub_news;
DROP POLICY IF EXISTS "hub_news_public_read"       ON public.hub_news;
DROP POLICY IF EXISTS "hub_news_staff_all"         ON public.hub_news;

CREATE POLICY "hub_news_select_published" ON public.hub_news
  FOR SELECT USING (published = true);

CREATE POLICY "hub_news_auth_all" ON public.hub_news
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                     ON public.hub_news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_news TO authenticated;

-- ── 3. hub_exams ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hub_exams (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT        NOT NULL,
  institution           TEXT        NOT NULL DEFAULT '',
  course                TEXT        NOT NULL DEFAULT '',
  year                  INT         NOT NULL DEFAULT 2024,
  subjects              TEXT[]      NOT NULL DEFAULT '{}',
  difficulty            TEXT        NOT NULL DEFAULT 'Médio'
    CHECK (difficulty IN ('Fácil','Médio','Difícil')),
  description           TEXT        NOT NULL DEFAULT '',
  featured              BOOLEAN     NOT NULL DEFAULT false,
  active                BOOLEAN     NOT NULL DEFAULT true,
  file_url              TEXT,
  solution_url          TEXT,
  allow_registrations   BOOLEAN     NOT NULL DEFAULT false,
  registration_url      TEXT,
  registration_deadline TEXT,
  registration_fee      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_exams_select_public" ON public.hub_exams;
DROP POLICY IF EXISTS "hub_exams_auth_all"      ON public.hub_exams;

CREATE POLICY "hub_exams_select_public" ON public.hub_exams
  FOR SELECT USING (active = true);

CREATE POLICY "hub_exams_auth_all" ON public.hub_exams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                     ON public.hub_exams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_exams TO authenticated;

-- ── 4. hub_documents ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hub_documents') THEN
    ALTER TABLE public.hub_documents ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hub_documents') THEN
    DROP POLICY IF EXISTS "hub_documents_select_published" ON public.hub_documents;
    CREATE POLICY "hub_documents_select_published" ON public.hub_documents
      FOR SELECT USING (published = true);
    EXECUTE 'GRANT SELECT ON public.hub_documents TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_documents TO authenticated';
  END IF;
END $$;

-- ── 5. campaigns ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  active         BOOLEAN     NOT NULL DEFAULT true,
  type           TEXT        NOT NULL DEFAULT 'banner'
    CHECK (type IN ('banner','slider','mini','popup')),
  title          TEXT        NOT NULL,
  subtitle       TEXT        NOT NULL DEFAULT '',
  description    TEXT        NOT NULL DEFAULT '',
  image_url      TEXT,
  cta_text       TEXT        NOT NULL DEFAULT 'Ver promoção',
  cta_url        TEXT        NOT NULL DEFAULT '/orcamento',
  urgency        TEXT        NOT NULL DEFAULT 'none'
    CHECK (urgency IN ('none','timer','stock','coupon')),
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

DROP POLICY IF EXISTS "campaigns_select_active" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_auth_all"       ON public.campaigns;
DROP POLICY IF EXISTS "Public read active campaigns" ON public.campaigns;

CREATE POLICY "campaigns_select_active" ON public.campaigns
  FOR SELECT USING (active = true);

CREATE POLICY "campaigns_auth_all" ON public.campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT                     ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;

-- ── 6. blog_posts grants ──────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    EXECUTE 'GRANT SELECT ON public.blog_posts TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated';
    DROP POLICY IF EXISTS "blog_posts_select_published" ON public.blog_posts;
    CREATE POLICY "blog_posts_select_published" ON public.blog_posts
      FOR SELECT USING (published = true);
    CREATE POLICY "blog_posts_auth_all" ON public.blog_posts
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 7. gallery_items grants ───────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery_items') THEN
    EXECUTE 'GRANT SELECT ON public.gallery_items TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated';
  END IF;
END $$;
