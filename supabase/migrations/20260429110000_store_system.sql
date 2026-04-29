
-- ============================================================
-- Giseveral e Services – Loja / Store System
-- ============================================================

-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'admin', 'staff'));

-- --------------------------------------------------------
-- PRODUCT CATEGORIES
-- --------------------------------------------------------
CREATE TABLE public.product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  icon       TEXT,
  type       TEXT NOT NULL CHECK (type IN ('produto', 'servico')),
  sort_order INT NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.product_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- --------------------------------------------------------
-- PRODUCTS (papelaria & serviços com preço fixo)
-- --------------------------------------------------------
CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES public.product_categories(id),
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(10,2),
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit          TEXT NOT NULL DEFAULT 'un',
  brand         TEXT,
  image_url     TEXT,
  specs         JSONB NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admin manage products" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- DELIVERY ZONES
-- --------------------------------------------------------
CREATE TABLE public.delivery_zones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  neighborhoods  TEXT[] NOT NULL DEFAULT '{}',
  fee            NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_time TEXT,
  active         BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read delivery zones" ON public.delivery_zones FOR SELECT USING (active = true);
CREATE POLICY "Admin manage delivery zones" ON public.delivery_zones FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- --------------------------------------------------------
-- ORDERS
-- --------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq;

CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT NOT NULL UNIQUE DEFAULT ('GIS-' || LPAD(nextval('public.order_number_seq')::TEXT, 5, '0')),
  user_id          UUID REFERENCES auth.users(id),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  neighborhood     TEXT NOT NULL,
  address          TEXT,
  reference_point  TEXT,
  delivery_type    TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_zone_id UUID REFERENCES public.delivery_zones(id),
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal         NUMERIC(10,2) NOT NULL,
  total            NUMERIC(10,2) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','delivering','delivered','cancelled')),
  payment_method   TEXT NOT NULL DEFAULT 'cash',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone create order" ON public.orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin all orders" ON public.orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- ORDER ITEMS
-- --------------------------------------------------------
CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('produto','servico')),
  product_id  UUID REFERENCES public.products(id),
  name        TEXT NOT NULL,
  description TEXT,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL,
  file_url    TEXT,
  specs       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items follow order" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL)
    )
  );
CREATE POLICY "Anyone insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin all order items" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- --------------------------------------------------------
-- SEED: CATEGORIES
-- --------------------------------------------------------
INSERT INTO public.product_categories (name, slug, icon, type, sort_order) VALUES
  ('Cadernos',        'cadernos',        'BookOpen',     'produto',  1),
  ('Canetas e Lápis', 'canetas-lapis',   'Pen',          'produto',  2),
  ('Pastas e Arquivos','pastas-arquivos','FolderOpen',   'produto',  3),
  ('Material Escolar','material-escolar','GraduationCap','produto',  4),
  ('Papel e Blocos',  'papel-blocos',    'FileText',     'produto',  5),
  ('Impressão',       'impressao',       'Printer',      'servico',  6),
  ('Formatação PC',   'formatacao-pc',   'Laptop',       'servico',  7),
  ('Redes e Wi-Fi',   'redes-wifi',      'Wifi',         'servico',  8),
  ('Design Gráfico',  'design-grafico',  'Palette',      'servico',  9);

-- --------------------------------------------------------
-- SEED: DELIVERY ZONES (Beira, Moçambique)
-- --------------------------------------------------------
INSERT INTO public.delivery_zones (name, neighborhoods, fee, estimated_time) VALUES
  ('Centro da Cidade', ARRAY['Munhava','Ponta-Gêa','Chaimite','Maquinino','Macuti'],     50,  '30–45 min'),
  ('Zona Próxima',     ARRAY['Manga','Esturro','Inhamizua','Palmeiras','Alto da Manga'], 100, '45–60 min'),
  ('Zona Distante',    ARRAY['Matacuane','Ndunda','Macurrungo','Goto','Nhaconjo'],       150, '1–2 horas');

-- --------------------------------------------------------
-- SEED: PRODUCTS (papelaria)
-- --------------------------------------------------------
INSERT INTO public.products (category_id, name, description, price, stock, unit, brand, specs)
SELECT c.id, p.name, p.description, p.price, p.stock, p.unit, p.brand, p.specs::jsonb
FROM (VALUES
  ('cadernos',        'Caderno Universitário 96 folhas',  'Capa dura, 96 folhas pautadas',            120.00, 50, 'un', 'Unilux',       '{"folhas":96,"tipo":"universitário","capa":"dura"}'),
  ('cadernos',        'Caderno Universitário 200 folhas', 'Premium, 200 folhas, capa dura',            220.00, 30, 'un', 'Spiral',       '{"folhas":200,"tipo":"universitário","capa":"dura"}'),
  ('cadernos',        'Caderno A4 espiral 80 folhas',     'A4, espiral, 80 folhas pautadas',            95.00, 40, 'un', 'Genérico',     '{"folhas":80,"tipo":"A4","capa":"flexível"}'),
  ('canetas-lapis',   'Caneta Esferográfica Azul (cx 12)','Caixa com 12 canetas esferográficas',       180.00,100, 'cx', 'BIC',          '{"cor":"azul","quantidade":12}'),
  ('canetas-lapis',   'Lápis HB (cx 12)',                 'Caixa com 12 lápis HB',                    120.00, 80, 'cx', 'Faber-Castell','{"dureza":"HB","quantidade":12}'),
  ('canetas-lapis',   'Caneta Marcador Permanente',       'Marcador permanente preto',                  85.00, 60, 'un', 'BIC',          '{"cor":"preto","tipo":"permanente"}'),
  ('pastas-arquivos', 'Pasta Arquivo AZ Lombo Largo',     'AZ lombo largo, anel reforçado',            250.00, 25, 'un', 'Durable',      '{"tipo":"AZ","lombo":"largo"}'),
  ('pastas-arquivos', 'Pasta Plástica com Mola',          'Plástico transparente, fecho de mola',       45.00, 80, 'un', 'Genérico',     '{"material":"plástico","fecho":"mola"}'),
  ('papel-blocos',    'Resma A4 80g (500 folhas)',        'Papel A4 80g/m², 500 folhas',               450.00,100, 'rs', 'Chamex',       '{"gramagem":"80g","folhas":500,"tamanho":"A4"}'),
  ('papel-blocos',    'Bloco A4 pautado 50 folhas',       'Bloco A4 destacável, pautado',               65.00, 60, 'un', 'Genérico',     '{"folhas":50,"tipo":"pautado"}'),
  ('material-escolar','Mochila Escolar',                  'Resistente, múltiplos compartimentos',      850.00, 20, 'un', 'Genérico',     '{"compartimentos":3,"material":"poliéster"}'),
  ('material-escolar','Estojo Plástico',                  'Estojo plástico com fecho de correr',        55.00, 60, 'un', 'Genérico',     '{"material":"plástico","tamanho":"médio"}')
) AS p(slug, name, description, price, stock, unit, brand, specs)
JOIN public.product_categories c ON c.slug = p.slug;
