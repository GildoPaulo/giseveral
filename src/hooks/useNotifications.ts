import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifType = "order" | "progress" | "delivery" | "done" | "promo" | "alert" | "info";

export type AppNotification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { setNotifications([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, link, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(data as AppNotification[]);
      }
    } catch {
      // silently ignore — bell shows empty if DB not available
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as AppNotification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === (payload.new as AppNotification).id ? payload.new as AppNotification : n))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user?.id ?? "");
    } catch { /* optimistic update already applied */ }
  }, [user?.id]);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds)
        .eq("user_id", user?.id ?? "");
    } catch { /* optimistic update already applied */ }
  }, [notifications, user?.id]);

  const clickNotification = useCallback(
    (n: AppNotification) => {
      markRead(n.id);
      if (n.link) {
        // n.link is a dynamic path string — cast required for TanStack Router
        navigate({ to: n.link as never });
      }
    },
    [markRead, navigate]
  );

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id ?? "");
    } catch { /* optimistic update already applied */ }
  }, [user?.id]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    clickNotification,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

// ── Relative time helper ─────────────────────────────────────────────────────

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}
