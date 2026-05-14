-- Fix scholarship_applications.user_id: must be UUID to reference auth.users(id)
-- Fix gallery_items: add active, display_order, image_url when legacy table only had url
-- Blog: optional tags for SEO / filters

-- ── gallery_items (legacy) — columns expected by homepage / policies ─────────
DO $$
BEGIN
  IF to_regclass('public.gallery_items') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_items' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.gallery_items ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE public.gallery_items ADD COLUMN display_order INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.gallery_items ADD COLUMN image_url TEXT;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_items' AND column_name = 'url'
  ) THEN
    EXECUTE 'UPDATE public.gallery_items SET image_url = COALESCE(image_url, url) WHERE image_url IS NULL';
  END IF;
END $$;

-- ── scholarship_applications & related — UUID user_id ───────────────────────
DO $$
BEGIN
  IF to_regclass('public.scholarship_applications') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.scholarship_applications DROP CONSTRAINT IF EXISTS scholarship_applications_user_id_fkey;
  ALTER TABLE public.scholarship_applications
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  ALTER TABLE public.scholarship_applications
    ADD CONSTRAINT scholarship_applications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'scholarship_applications user_id migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF to_regclass('public.application_documents') IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'application_documents'
      AND column_name = 'uploaded_by' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.application_documents DROP CONSTRAINT IF EXISTS application_documents_uploaded_by_fkey;
    ALTER TABLE public.application_documents
      ALTER COLUMN uploaded_by TYPE uuid USING (
        CASE
          WHEN uploaded_by IS NULL OR btrim(uploaded_by) = '' THEN NULL
          WHEN uploaded_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN uploaded_by::uuid
          ELSE NULL
        END
      );
    ALTER TABLE public.application_documents
      ADD CONSTRAINT application_documents_uploaded_by_fkey
      FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'application_documents.uploaded_by migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF to_regclass('public.autofill_profiles') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.autofill_profiles DROP CONSTRAINT IF EXISTS autofill_profiles_user_id_fkey;
  ALTER TABLE public.autofill_profiles
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  ALTER TABLE public.autofill_profiles
    ADD CONSTRAINT autofill_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'autofill_profiles user_id migration skipped: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF to_regclass('public.matching_scores') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.matching_scores DROP CONSTRAINT IF EXISTS matching_scores_user_id_fkey;
  ALTER TABLE public.matching_scores
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  ALTER TABLE public.matching_scores
    ADD CONSTRAINT matching_scores_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'matching_scores user_id migration skipped: %', SQLERRM;
END $$;

-- ── blog_posts — tags for filters / SEO ─────────────────────────────────────
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
