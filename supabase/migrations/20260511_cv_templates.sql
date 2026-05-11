CREATE TABLE IF NOT EXISTS cv_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  category text DEFAULT 'profissional',
  preview_url text,
  html_content text,
  css_content text,
  reactive_id text,
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active cv_templates"
  ON cv_templates FOR SELECT USING (true);

CREATE POLICY "Admins can manage cv_templates"
  ON cv_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );
