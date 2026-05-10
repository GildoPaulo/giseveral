const CACHE = "giseveral-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(["/", "/hub", "/loja", "/servicos", "/precos"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  if (url.includes("supabase.co") || url.includes("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  let data = { title: "Giseveral", body: "Tens uma nova notificação.", url: "/" };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.jpeg",
      badge: "/icon.jpeg",
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: "giseveral-push",         // collapse duplicate notifications
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url ?? "/";
  const origin = self.location.origin;

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Try to focus an existing tab on the same origin
      for (const client of list) {
        if (new URL(client.url).origin === origin && "focus" in client) {
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      // No existing tab — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});
