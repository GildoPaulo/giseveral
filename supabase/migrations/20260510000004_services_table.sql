-- ============================================================
-- services table — replaces localStorage-based service config
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        UNIQUE NOT NULL,
  title         TEXT        NOT NULL,
  subtitle      TEXT        NOT NULL DEFAULT '',
  icon_name     TEXT        NOT NULL DEFAULT 'wrench',
  price_from    TEXT        NOT NULL DEFAULT 'Orçamento',
  description   TEXT        NOT NULL DEFAULT '',
  features      TEXT[]      NOT NULL DEFAULT '{}',
  badge         TEXT,
  active        BOOLEAN     NOT NULL DEFAULT true,
  pedir_enabled BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read"  ON public.services;
DROP POLICY IF EXISTS "services_auth_manage"  ON public.services;

CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (active = true);

CREATE POLICY "services_auth_manage" ON public.services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults only when table is empty
INSERT INTO public.services
  (slug, title, subtitle, icon_name, price_from, description, features, badge, sort_order)
SELECT slug, title, subtitle, icon_name, price_from, description, features, badge, sort_order
FROM (VALUES
  ('reprografia',    'Reprografia',            'Impressão, fotocópias e digitalização',  'printer',  '3 MZN/pág', 'Impressão P&B, cores, fotocópias, encadernação e plastificação.',  ARRAY['Impressão a cores e preto e branco','Fotocópias rápidas','Digitalização de documentos','Encadernação e plastificação'], 'Mais popular', 1),
  ('papelaria',      'Papelaria',              'Material escolar e de escritório',        'book-open','55 MZN',    'Cadernos, pastas, canetas, resmas e material de escritório.',      ARRAY['Material escolar e cadernos','Material de escritório','Pastas, canetas e estojos','Resmas de papel e blocos'],       NULL,          2),
  ('design-grafico', 'Design Gráfico',         'Logos, flyers, banners e convites',       'palette',  '400 MZN',   'Criação de logótipos, flyers, cartazes e identidade visual.',      ARRAY['Flyers e panfletos','Cartazes e banners','Logos e identidade visual','Convites personalizados'],               NULL,          3),
  ('informatica',    'Assistência Informática','Formatação, Windows e remoção de vírus',  'laptop',   '300 MZN',   'Formatação, Windows, vírus, reparação e upgrade de hardware.',     ARRAY['Formatação de computadores','Instalação de Windows e programas','Remoção de vírus e malware','Optimização e upgrade'],NULL,         4),
  ('redes',          'Redes e Tecnologia',     'Wi-Fi, routers e cabeamento',             'network',  '400 MZN',   'Instalação Wi-Fi, configuração de routers e cabeamento LAN.',      ARRAY['Instalação de Wi-Fi e LAN','Configuração de routers','Cabeamento estruturado','Diagnóstico de rede'],            NULL,          5)
) AS d(slug, title, subtitle, icon_name, price_from, description, features, badge, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);
