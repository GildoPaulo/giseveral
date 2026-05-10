import { useState, useEffect } from "react";
import { toast } from "sonner";

export const VAPID_PUBLIC_KEY =
  "BCRMoEH3RVWPg7NYPGtPnth4x4uL5ZOR7kIhEvadQdpNA4SbuqjJAUzWRXuVAS4ARe-kTo3HSCeM4Ml8p-RHK1Y";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function detectSupport(): { ok: boolean; reason?: string } {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "O teu navegador não suporta Service Workers." };
  if (!("PushManager" in window)) return { ok: false, reason: "O teu navegador não suporta Push Notifications." };
  if (!("Notification" in window)) return { ok: false, reason: "O teu navegador não suporta Notificações." };
  return { ok: true };
}

export function usePushNotifications(role = "user") {
  const support = detectSupport();
  const [supported] = useState(support.ok);
  const [unsupportedReason] = useState(support.reason);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!support.ok) return;
    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
      );
    }
  }, []);

  async function subscribe() {
    if (!supported) {
      if (unsupportedReason) toast.error(unsupportedReason);
      return;
    }
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Permissão de notificações negada.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const key = sub.getKey("p256dh");
      const auth = sub.getKey("auth");
      if (!key || !auth) throw new Error("Missing push keys");

      const deviceName = `${navigator.platform} — ${navigator.userAgent.split(")")[0].split("(")[1] ?? ""}`.trim();

      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          role,
          device_name: deviceName,
        }),
      });
      setSubscribed(true);
      toast.success("Notificações activadas!", {
        description: "Receberás alertas importantes de pedidos e novidades.",
      });
    } catch (err) {
      console.error("Push subscribe error:", err);
      toast.error("Erro ao activar notificações. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.info("Notificações desactivadas.");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      toast.error("Erro ao desactivar notificações.");
    } finally {
      setLoading(false);
    }
  }

  return { supported, unsupportedReason, permission, subscribed, loading, subscribe, unsubscribe };
}
