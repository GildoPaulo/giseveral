-- ============================================================
-- Atomic increment functions to avoid race conditions
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_news_views(news_id TEXT)
RETURNS void LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE public.hub_news SET views = COALESCE(views, 0) + 1 WHERE id::text = news_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_news_views(TEXT) TO anon, authenticated;
