-- ============================================================
-- Hub System: Documents, Letters, Credits
-- ============================================================

-- 1. Add hub columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hub_credits   INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS hub_premium   BOOLEAN NOT NULL DEFAULT false;

-- 2. hub_documents table
CREATE TABLE IF NOT EXISTS public.hub_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  author       TEXT        NOT NULL DEFAULT 'Giseveral',
  category     TEXT        NOT NULL,
  pages        INTEGER     NOT NULL DEFAULT 1,
  description  TEXT        NOT NULL DEFAULT '',
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  file_url     TEXT,
  cover_hue    INTEGER     NOT NULL DEFAULT 210,
  premium      BOOLEAN     NOT NULL DEFAULT false,
  published    BOOLEAN     NOT NULL DEFAULT true,
  downloads    INTEGER     NOT NULL DEFAULT 0,
  views        INTEGER     NOT NULL DEFAULT 0,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can read published documents
CREATE POLICY "hub_documents_select_published"
  ON public.hub_documents FOR SELECT
  USING (published = true);

-- Staff can do anything
CREATE POLICY "hub_documents_staff_all"
  ON public.hub_documents FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- Authenticated users can insert their own documents
CREATE POLICY "hub_documents_insert_own"
  ON public.hub_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own documents
CREATE POLICY "hub_documents_update_own"
  ON public.hub_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hub_documents_delete_own"
  ON public.hub_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER hub_documents_updated_at
  BEFORE UPDATE ON public.hub_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. hub_generated_letters table
CREATE TABLE IF NOT EXISTS public.hub_generated_letters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  letter_type  TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  form_data    JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_generated_letters ENABLE ROW LEVEL SECURITY;

-- Users can only see their own letters
CREATE POLICY "hub_letters_select_own"
  ON public.hub_generated_letters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "hub_letters_insert_own"
  ON public.hub_generated_letters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hub_letters_delete_own"
  ON public.hub_generated_letters FOR DELETE
  USING (auth.uid() = user_id);

-- Staff can read all letters
CREATE POLICY "hub_letters_staff_select"
  ON public.hub_generated_letters FOR SELECT
  USING (is_staff());

-- 4. Storage bucket: hub-documents (public, PDF only, 50 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hub-documents',
  'hub-documents',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "hub_docs_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hub-documents');

CREATE POLICY "hub_docs_storage_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hub-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "hub_docs_storage_delete_staff"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hub-documents' AND is_staff());

-- 5. Seed initial documents
INSERT INTO public.hub_documents
  (id, title, author, category, pages, description, tags, cover_hue, premium, downloads, views)
VALUES
  (
    '11111111-0001-0000-0000-000000000001',
    'Relatório de Estágio — Modelo Completo',
    'Giseveral Editorial',
    'trabalhos',
    28,
    'Modelo completo para relatório de estágio curricular. Inclui capa, índice, introdução, desenvolvimento e conclusão formatados segundo as normas ABNT/APA.',
    ARRAY['estágio','relatório','normas','modelo'],
    210, false, 412, 1840
  ),
  (
    '11111111-0002-0000-0000-000000000002',
    'Monografia — Estrutura e Normas',
    'Giseveral Editorial',
    'trabalhos',
    45,
    'Guia completo para estruturar e formatar uma monografia. Aborda metodologia, revisão bibliográfica, citações e referências segundo normas internacionais.',
    ARRAY['monografia','tcc','normas','pesquisa'],
    260, false, 289, 1150
  ),
  (
    '11111111-0003-0000-0000-000000000003',
    'Contrato de Prestação de Serviços',
    'Giseveral Editorial',
    'livros',
    8,
    'Modelo de contrato para prestação de serviços entre pessoas singulares ou colectivas. Cláusulas ajustáveis ao contexto moçambicano.',
    ARRAY['contrato','prestação','serviços','jurídico'],
    30, false, 756, 2310
  ),
  (
    '11111111-0004-0000-0000-000000000004',
    'Contrato de Arrendamento Residencial',
    'Giseveral Editorial',
    'livros',
    12,
    'Modelo de contrato de arrendamento habitacional adaptado à legislação moçambicana vigente. Inclui cláusulas de garantia, manutenção e rescisão.',
    ARRAY['arrendamento','contrato','habitação','aluguel'],
    15, true, 198, 870
  ),
  (
    '11111111-0005-0000-0000-000000000005',
    'Curriculum Vitae — Formato Profissional',
    'Giseveral Editorial',
    'cvs',
    3,
    'Modelo de CV profissional em formato cronológico inverso. Design limpo e moderno, compatível com sistemas ATS utilizados por empresas internacionais.',
    ARRAY['cv','currículo','emprego','candidatura'],
    160, false, 1203, 4580
  ),
  (
    '11111111-0006-0000-0000-000000000006',
    'Plano de Negócios — Template Completo',
    'Giseveral Business',
    'trabalhos',
    32,
    'Template detalhado para elaborar um plano de negócios. Inclui análise de mercado, projecções financeiras, estratégia de marketing e análise SWOT.',
    ARRAY['plano','negócios','empreendedorismo','financeiro'],
    140, true, 345, 1620
  ),
  (
    '11111111-0007-0000-0000-000000000007',
    'Folha de Rosto — Universidade Eduardo Mondlane',
    'Comunidade Hub',
    'trabalhos',
    1,
    'Modelo oficial de folha de rosto para trabalhos académicos da Universidade Eduardo Mondlane (UEM). Actualizado para o ano lectivo 2025.',
    ARRAY['uem','folha de rosto','académico','universidade'],
    200, false, 892, 3200
  ),
  (
    '11111111-0008-0000-0000-000000000008',
    'Manual de Boas-Vindas para Colaboradores',
    'Giseveral Business',
    'livros',
    18,
    'Modelo de manual de integração para novos colaboradores. Inclui cultura organizacional, políticas internas, benefícios e procedimentos operacionais.',
    ARRAY['rh','colaboradores','empresa','onboarding'],
    280, false, 124, 560
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Performance indexes
CREATE INDEX IF NOT EXISTS idx_hub_documents_published_downloads
  ON public.hub_documents (published, downloads DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_hub_documents_category_published
  ON public.hub_documents (category, published)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_hub_documents_created_at
  ON public.hub_documents (created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_hub_documents_user_id
  ON public.hub_documents (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hub_letters_user_id
  ON public.hub_generated_letters (user_id, created_at DESC);
