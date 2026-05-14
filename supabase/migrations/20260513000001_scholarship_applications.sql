-- Scholarship Application System
-- Tracks user applications to scholarships with matching scores and documents

-- Main applications table
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id TEXT NOT NULL REFERENCES hub_scholarships(id) ON DELETE CASCADE,
  
  -- Application status workflow
  status TEXT NOT NULL DEFAULT 'draft'::TEXT CHECK (status IN ('draft', 'submitted', 'in_review', 'accepted', 'rejected', 'completed')),
  submitted_at TIMESTAMPTZ,
  
  -- AI Matching score (0-100)
  match_score INT CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons TEXT[], -- Array of reasons why this is a good match
  
  -- Application data
  personal_statement TEXT,
  motivation_letter TEXT,
  
  -- Progress tracking
  completed_steps TEXT[], -- Array of completed form steps
  current_step TEXT,
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at_calculated TIMESTAMPTZ GENERATED ALWAYS AS (
    CASE WHEN status = 'submitted' THEN submitted_at ELSE NULL END
  ) STORED
);

-- Unique constraint: one active application per user per scholarship (partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_application_per_scholarship
  ON scholarship_applications(user_id, scholarship_id)
  WHERE (status != 'rejected' AND status != 'completed');

-- Document uploads for applications
CREATE TABLE IF NOT EXISTS application_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_type TEXT NOT NULL, -- 'cv', 'motivation_letter', 'recommendation', 'transcript', 'certificate', 'custom'
  label TEXT, -- Custom label if needed
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INT,
  file_mime_type TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'uploaded'::TEXT CHECK (status IN ('uploaded', 'verified', 'rejected')),
  verification_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by TEXT REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Auto-fill templates (pre-saved user data for quick application)
CREATE TABLE IF NOT EXISTS autofill_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile name (e.g., "European Master Application", "PhD Kit")
  profile_name TEXT NOT NULL,
  
  -- Pre-filled data (JSONB for flexibility)
  personal_statement TEXT,
  motivation_template TEXT,
  
  -- Linked CV version
  cv_data JSONB, -- Snapshot of CV data at profile creation
  
  -- Auto-select documents
  preferred_documents TEXT[], -- Document types to auto-attach
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Application notifications/timeline
CREATE TABLE IF NOT EXISTS application_timeline (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  application_id TEXT NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'created', 'submitted', 'review_started', 'feedback', 'accepted', 'rejected', 'document_requested'
  title TEXT NOT NULL,
  description TEXT,
  
  -- For feedback/requests
  requires_action BOOLEAN DEFAULT FALSE,
  action_required_by TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matching algorithm scores (for analytics & AI training)
CREATE TABLE IF NOT EXISTS matching_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id TEXT NOT NULL REFERENCES hub_scholarships(id) ON DELETE CASCADE,
  
  -- Score breakdown
  education_match INT, -- Based on degree level, institution ranking
  experience_match INT, -- Years of experience, relevant skills
  language_match INT, -- Required languages available
  area_match INT, -- Academic area alignment
  location_match INT, -- Country/region preference
  coverage_match INT, -- Financial needs vs coverage
  
  -- Overall score (weighted average)
  overall_score INT,
  
  -- Reasoning
  match_notes TEXT,
  
  -- For ML improvements
  user_feedback INT, -- User rating: -1 (bad), 0 (neutral), 1 (good)
  user_feedback_reason TEXT,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scholarship_applications_user ON scholarship_applications(user_id);
CREATE INDEX idx_scholarship_applications_status ON scholarship_applications(status);
CREATE INDEX idx_scholarship_applications_match_score ON scholarship_applications(match_score DESC);
CREATE INDEX idx_application_documents_application ON application_documents(application_id);
CREATE INDEX idx_autofill_profiles_user ON autofill_profiles(user_id);
CREATE INDEX idx_matching_scores_user ON matching_scores(user_id);
CREATE INDEX idx_matching_scores_overall ON matching_scores(overall_score DESC);

-- Enable RLS
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE autofill_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own applications"
  ON scholarship_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON scholarship_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON scholarship_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own documents"
  ON application_documents FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM scholarship_applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own documents"
  ON application_documents FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM scholarship_applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own autofill profiles"
  ON autofill_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own autofill profiles"
  ON autofill_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own timeline"
  ON application_timeline FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM scholarship_applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own matching scores"
  ON matching_scores FOR SELECT
  USING (auth.uid() = user_id);
