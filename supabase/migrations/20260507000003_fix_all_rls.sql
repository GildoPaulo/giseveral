-- ============================================================
-- Giseveral – Fix all RLS so any authenticated user can manage
-- hub/gallery/blog content from the admin panel.
-- is_staff() check kept only for public-facing read policies.
-- ============================================================

-- --------------------------------------------------------
-- 1. STORAGE: images bucket — allow any authenticated user to upload
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Staff upload images"  ON storage.objects;
DROP POLICY IF EXISTS "Staff delete images"  ON storage.objects;
DROP POLICY IF EXISTS "Staff update images"  ON storage.objects;

CREATE POLICY "Auth upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Auth delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Auth update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images');

-- --------------------------------------------------------
-- 2. STORAGE: hub-documents bucket — ensure policies exist
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hub-documents', 'hub-documents', true, 52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "hub_docs_storage_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "hub_docs_storage_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "hub_docs_storage_delete_staff"   ON storage.objects;

CREATE POLICY "hub_docs_storage_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'hub-documents');

CREATE POLICY "hub_docs_storage_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hub-documents');

CREATE POLICY "hub_docs_storage_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'hub-documents');

-- --------------------------------------------------------
-- 3. hub_documents — allow authenticated users to manage all docs
-- --------------------------------------------------------
DROP POLICY IF EXISTS "hub_documents_staff_all"    ON public.hub_documents;
DROP POLICY IF EXISTS "hub_documents_insert_own"   ON public.hub_documents;
DROP POLICY IF EXISTS "hub_documents_update_own"   ON public.hub_documents;
DROP POLICY IF EXISTS "hub_documents_delete_own"   ON public.hub_documents;
DROP POLICY IF EXISTS "hub_documents_select_published" ON public.hub_documents;

-- Public: see published only
CREATE POLICY "hub_documents_select_published"
  ON public.hub_documents FOR SELECT
  USING (published = true OR auth.role() = 'authenticated');

-- Authenticated: full management
CREATE POLICY "hub_documents_auth_all"
  ON public.hub_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 4. hub_news — allow authenticated to manage
-- --------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_news') THEN
    DROP POLICY IF EXISTS "Staff manage hub_news"      ON public.hub_news;
    DROP POLICY IF EXISTS "Public read hub_news"       ON public.hub_news;
    DROP POLICY IF EXISTS "hub_news_select_published"  ON public.hub_news;
    DROP POLICY IF EXISTS "hub_news_auth_all"          ON public.hub_news;

    EXECUTE $p$
      CREATE POLICY "hub_news_select_published" ON public.hub_news
        FOR SELECT USING (published = true OR auth.role() = 'authenticated');
      CREATE POLICY "hub_news_auth_all" ON public.hub_news
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;
  END IF;
END $$;

-- --------------------------------------------------------
-- 5. hub_scholarships — allow authenticated to manage
-- --------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_scholarships') THEN
    DROP POLICY IF EXISTS "Staff manage hub_scholarships"  ON public.hub_scholarships;
    DROP POLICY IF EXISTS "Public read hub_scholarships"   ON public.hub_scholarships;
    DROP POLICY IF EXISTS "hub_scholarships_auth_all"      ON public.hub_scholarships;

    EXECUTE $p$
      CREATE POLICY "hub_scholarships_select_public" ON public.hub_scholarships
        FOR SELECT USING (active = true OR auth.role() = 'authenticated');
      CREATE POLICY "hub_scholarships_auth_all" ON public.hub_scholarships
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;
  END IF;
END $$;

-- --------------------------------------------------------
-- 6. hub_exams — allow authenticated to manage
-- --------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hub_exams') THEN
    DROP POLICY IF EXISTS "Staff manage hub_exams"  ON public.hub_exams;
    DROP POLICY IF EXISTS "Public read hub_exams"   ON public.hub_exams;
    DROP POLICY IF EXISTS "hub_exams_auth_all"      ON public.hub_exams;

    EXECUTE $p$
      CREATE POLICY "hub_exams_select_public" ON public.hub_exams
        FOR SELECT USING (active = true OR auth.role() = 'authenticated');
      CREATE POLICY "hub_exams_auth_all" ON public.hub_exams
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $p$;
  END IF;
END $$;

-- --------------------------------------------------------
-- 7. gallery_items — allow authenticated to manage
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Public read gallery"  ON public.gallery_items;

CREATE POLICY "Public read gallery" ON public.gallery_items
  FOR SELECT USING (true);

CREATE POLICY "Auth manage gallery" ON public.gallery_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 8. blog_posts — allow authenticated to manage
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage posts"          ON public.blog_posts;
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;

CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT USING (published = true OR auth.role() = 'authenticated');

CREATE POLICY "Auth manage posts" ON public.blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 9. service-uploads — ensure authenticated INSERT exists
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users upload" ON storage.objects;
CREATE POLICY "Authenticated users upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-uploads');
