-- Expand hub_scholarships with rich content columns
ALTER TABLE hub_scholarships
  ADD COLUMN IF NOT EXISTS content_rich TEXT,
  ADD COLUMN IF NOT EXISTS guides JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_applications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS views INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applications_count INT DEFAULT 0;

-- Q&A / comments per scholarship
CREATE TABLE IF NOT EXISTS bolsa_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id TEXT NOT NULL REFERENCES hub_scholarships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES bolsa_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bolsa_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bolsa_comments_public_read"
  ON bolsa_comments FOR SELECT
  USING (approved = true);

CREATE POLICY "bolsa_comments_auth_insert"
  ON bolsa_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bolsa_comments_staff_all"
  ON bolsa_comments FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Application help requests submitted via scholarship pages
CREATE TABLE IF NOT EXISTS bolsa_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id TEXT NOT NULL REFERENCES hub_scholarships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  course TEXT,
  university TEXT,
  documents_have TEXT[] DEFAULT '{}',
  help_needed TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bolsa_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bolsa_applications_auth_insert"
  ON bolsa_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bolsa_applications_user_view"
  ON bolsa_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bolsa_applications_staff_all"
  ON bolsa_applications FOR ALL
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());
