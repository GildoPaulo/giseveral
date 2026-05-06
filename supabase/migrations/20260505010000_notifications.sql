-- ============================================================
-- Notifications system — per-user, RLS enforced
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL DEFAULT 'info',
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL DEFAULT '',
  link        TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see ONLY their own notifications
CREATE POLICY "notif_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notif_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notif_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Only staff / service-role can INSERT (not clients directly)
CREATE POLICY "notif_insert_staff"
  ON public.notifications FOR INSERT
  WITH CHECK (is_staff());

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read)
  WHERE is_read = false;

-- ── Helper function: create a notification (service-role only) ─────────────

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id   UUID,
  p_type      TEXT,
  p_title     TEXT,
  p_body      TEXT,
  p_link      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── Auto-notify on order status change ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_title   TEXT;
  v_body    TEXT;
  v_type    TEXT;
  v_link    TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Find user_id from profiles by order customer phone (best-effort)
  -- In production, orders should have a direct user_id FK
  v_user_id := NEW.user_id; -- assumes orders.user_id column exists
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  v_link := '/conta';

  CASE NEW.status
    WHEN 'confirmed' THEN
      v_type  := 'order';
      v_title := 'Pedido confirmado';
      v_body  := 'O seu pedido #' || NEW.order_number || ' foi confirmado e está a ser processado.';
    WHEN 'preparing' THEN
      v_type  := 'progress';
      v_title := 'Em preparação';
      v_body  := 'O pedido #' || NEW.order_number || ' está em preparação.';
    WHEN 'delivering' THEN
      v_type  := 'delivery';
      v_title := 'A caminho!';
      v_body  := 'O pedido #' || NEW.order_number || ' saiu para entrega. Previsto hoje.';
    WHEN 'delivered' THEN
      v_type  := 'done';
      v_title := 'Entregue com sucesso';
      v_body  := 'O pedido #' || NEW.order_number || ' foi entregue. Obrigado!';
    WHEN 'cancelled' THEN
      v_type  := 'alert';
      v_title := 'Pedido cancelado';
      v_body  := 'O pedido #' || NEW.order_number || ' foi cancelado. Contacte-nos para mais informações.';
    ELSE
      RETURN NEW;
  END CASE;

  PERFORM public.create_notification(v_user_id, v_type, v_title, v_body, v_link);
  RETURN NEW;
END;
$$;

-- Attach trigger to orders table (runs after status update)
DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;
CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- ── Batch mark-read function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = ANY(p_ids)
    AND user_id = auth.uid();
END;
$$;
