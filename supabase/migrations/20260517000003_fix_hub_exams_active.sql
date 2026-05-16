-- ============================================================
-- Fix: 32 exames criados no balcão mas invisíveis em /hub/exames.
-- Causa: linhas antigas têm active=NULL e o filtro client + RLS
-- usavam "active = true", excluindo silenciosamente todas elas.
-- ============================================================

-- 1) Backfill: tudo que está NULL passa a active=true.
UPDATE public.hub_exams SET active = true WHERE active IS NULL;

-- 2) Garante default true para inserts futuros.
ALTER TABLE public.hub_exams
  ALTER COLUMN active SET DEFAULT true;

-- 3) RLS tolerante a NULL (caso ainda apareçam).
DO $$ BEGIN
  DROP POLICY IF EXISTS "hub_exams_select_public" ON public.hub_exams;
  CREATE POLICY "hub_exams_select_public" ON public.hub_exams
    FOR SELECT USING (active IS NULL OR active = true);
END $$;

-- 4) Public read grant — garante que o role anon vê (idempotente).
GRANT SELECT ON public.hub_exams TO anon, authenticated;
