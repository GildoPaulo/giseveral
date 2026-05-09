-- ============================================================
-- Fix bolsa_comments, bolsa_applications policies + grants
-- Fix hub_scholarships select to allow auth users to see all
-- ============================================================

-- ── 1. bolsa_comments — fix policies (remove is_staff dependency) ─────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bolsa_comments') THEN
    DROP POLICY IF EXISTS "bolsa_comments_public_read"   ON public.bolsa_comments;
    DROP POLICY IF EXISTS "bolsa_comments_auth_insert"   ON public.bolsa_comments;
    DROP POLICY IF EXISTS "bolsa_comments_staff_all"     ON public.bolsa_comments;
    DROP POLICY IF EXISTS "bolsa_comments_select_approved" ON public.bolsa_comments;
    DROP POLICY IF EXISTS "bolsa_comments_insert_auth"   ON public.bolsa_comments;
    DROP POLICY IF EXISTS "bolsa_comments_auth_all"      ON public.bolsa_comments;

    EXECUTE $p$
      -- Public: see approved comments; authenticated: see all
      CREATE POLICY "bolsa_comments_select" ON public.bolsa_comments
        FOR SELECT USING (approved = true OR auth.role() = 'authenticated');

      -- Any authenticated user can insert their own comments
      CREATE POLICY "bolsa_comments_insert" ON public.bolsa_comments
        FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

      -- Authenticated can manage all (for admin operations)
      CREATE POLICY "bolsa_comments_auth_manage" ON public.bolsa_comments
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;

    EXECUTE 'GRANT SELECT ON public.bolsa_comments TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.bolsa_comments TO authenticated';
  END IF;
END $$;

-- ── 2. bolsa_applications — fix policies ──────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='bolsa_applications') THEN
    DROP POLICY IF EXISTS "bolsa_applications_auth_insert"  ON public.bolsa_applications;
    DROP POLICY IF EXISTS "bolsa_applications_user_view"    ON public.bolsa_applications;
    DROP POLICY IF EXISTS "bolsa_applications_staff_all"    ON public.bolsa_applications;
    DROP POLICY IF EXISTS "bolsa_applications_insert_auth"  ON public.bolsa_applications;
    DROP POLICY IF EXISTS "bolsa_applications_auth_all"     ON public.bolsa_applications;

    EXECUTE $p$
      CREATE POLICY "bolsa_applications_insert" ON public.bolsa_applications
        FOR INSERT TO authenticated WITH CHECK (true);

      CREATE POLICY "bolsa_applications_auth_manage" ON public.bolsa_applications
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;

    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.bolsa_applications TO authenticated';
  END IF;
END $$;

-- ── 3. hub_scholarships — ensure authenticated users can see ALL records ──────
DROP POLICY IF EXISTS "hub_scholarships_select_public" ON public.hub_scholarships;
DROP POLICY IF EXISTS "hub_scholarships_auth_all"      ON public.hub_scholarships;

-- Anon sees only active scholarships
CREATE POLICY "hub_scholarships_select_public" ON public.hub_scholarships
  FOR SELECT TO anon USING (active = true);

-- Authenticated sees and manages everything
CREATE POLICY "hub_scholarships_auth_all" ON public.hub_scholarships
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.hub_scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_scholarships TO authenticated;

-- ── 4. hub_exams — same treatment ─────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_exams') THEN
    DROP POLICY IF EXISTS "hub_exams_select_public" ON public.hub_exams;
    DROP POLICY IF EXISTS "hub_exams_auth_all"      ON public.hub_exams;

    EXECUTE $p$
      CREATE POLICY "hub_exams_select_public" ON public.hub_exams
        FOR SELECT TO anon USING (active = true);
      CREATE POLICY "hub_exams_auth_all" ON public.hub_exams
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;

    EXECUTE 'GRANT SELECT ON public.hub_exams TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_exams TO authenticated';
  END IF;
END $$;

-- ── 5. hub_news — same treatment ──────────────────────────────────────────────
DROP POLICY IF EXISTS "hub_news_select_published" ON public.hub_news;
DROP POLICY IF EXISTS "hub_news_auth_all"          ON public.hub_news;

CREATE POLICY "hub_news_select_published" ON public.hub_news
  FOR SELECT TO anon USING (published = true);

CREATE POLICY "hub_news_auth_all" ON public.hub_news
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.hub_news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_news TO authenticated;

-- ── 6. hub_documents — same treatment ────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_documents') THEN
    DROP POLICY IF EXISTS "hub_documents_select_published" ON public.hub_documents;
    DROP POLICY IF EXISTS "hub_documents_auth_all"         ON public.hub_documents;

    EXECUTE $p$
      CREATE POLICY "hub_documents_select_published" ON public.hub_documents
        FOR SELECT TO anon USING (published = true);
      CREATE POLICY "hub_documents_auth_all" ON public.hub_documents
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;

    EXECUTE 'GRANT SELECT ON public.hub_documents TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_documents TO authenticated';
  END IF;
END $$;
