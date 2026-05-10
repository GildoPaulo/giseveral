CREATE TABLE IF NOT EXISTS public.user_favorites (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type   TEXT        NOT NULL CHECK (item_type IN ('bolsa','noticia','produto','exame')),
  item_id     TEXT        NOT NULL,
  item_title  TEXT        NOT NULL DEFAULT '',
  item_url    TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_own" ON public.user_favorites;
CREATE POLICY "favorites_own" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
