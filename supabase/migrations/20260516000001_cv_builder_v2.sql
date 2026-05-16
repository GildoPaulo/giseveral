CREATE TABLE IF NOT EXISTS user_cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'O meu currículo',
  cv_data JSONB NOT NULL DEFAULT '{}',
  template TEXT DEFAULT 'classic',
  primary_color TEXT DEFAULT '#1E3A8A',
  font_family TEXT DEFAULT 'Inter',
  is_public BOOLEAN DEFAULT false,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own CVs" ON user_cvs;
CREATE POLICY "Users manage own CVs" ON user_cvs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read published CVs" ON user_cvs;
CREATE POLICY "Public read published CVs" ON user_cvs
  FOR SELECT USING (is_public = true);
