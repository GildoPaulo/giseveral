-- ─────────────────────────────────────────────────────────────────────
-- Unified comments (all content types: noticia, exame, blog, etc.)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unified_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,  -- 'noticia' | 'exame' | 'blog' | 'servico'
  content_id TEXT NOT NULL,    -- TEXT supports both UUID and slug-based IDs
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES unified_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE unified_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unified_comments_public_read"
  ON unified_comments FOR SELECT
  USING (approved = true);

CREATE POLICY "unified_comments_auth_insert"
  ON unified_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "unified_comments_staff_all"
  ON unified_comments FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- ─────────────────────────────────────────────────────────────────────
-- Unified help requests (bolsas, exames, serviços)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,  -- 'bolsa' | 'exame' | 'servico'
  content_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  help_needed TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_requests_auth_insert"
  ON help_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "help_requests_user_view"
  ON help_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "help_requests_staff_all"
  ON help_requests FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- ─────────────────────────────────────────────────────────────────────
-- Hub Exams
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hub_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  course TEXT NOT NULL,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  subjects TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'Médio',
  description TEXT,
  content_rich TEXT,
  guides JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  tips TEXT[] DEFAULT '{}',
  image_url TEXT,
  file_url TEXT,
  solution_url TEXT,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  comments_enabled BOOLEAN DEFAULT true,
  allow_registrations BOOLEAN DEFAULT false,
  registration_url TEXT,
  registration_deadline TEXT,
  registration_fee TEXT,
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hub_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_exams_public_read"
  ON hub_exams FOR SELECT
  USING (active = true);

CREATE POLICY "hub_exams_staff_all"
  ON hub_exams FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- ─────────────────────────────────────────────────────────────────────
-- Hub News
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hub_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT DEFAULT 'Bolsas',
  author TEXT DEFAULT 'Equipa Giseveral',
  date DATE DEFAULT CURRENT_DATE,
  image_url TEXT,
  content_rich TEXT,
  content TEXT[],  -- paragraph array (fallback / compat)
  related_scholarship_id TEXT REFERENCES hub_scholarships(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT true,
  comments_enabled BOOLEAN DEFAULT true,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hub_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_news_public_read"
  ON hub_news FOR SELECT
  USING (published = true);

CREATE POLICY "hub_news_staff_all"
  ON hub_news FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());
