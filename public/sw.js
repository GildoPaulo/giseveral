// Giseveral service worker v3 — KILL SWITCH for the old caching layer.
// v2 was intercepting fetch() and corrupting responses (cached HTML returned
// for JS modules, "Failed to convert value to 'Response'" when cache miss).
// This version:
//   • Removes the fetch handler entirely — every request goes straight to
//     the network with no SW interference. Solves the 502 / MIME issues.
//   • Wipes any leftover Cache Storage from previous versions on activate.
//   • Unregisters itself if it doesn't have anything else to do, so old
//     installs slowly drain out.
//   • Keeps push notifications working.

const CACHE_PREFIX = "giseveral-";

self.addEventListener("install", (event) => {
  // Skip waiting so the new SW takes over immediately on next page load.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Nuke every cache this SW (or its predecessors) ever created.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Push notifications — kept as the only useful SW feature.
self.addEventListener("push", (event) => {
  let data = { title: "Giseveral", body: "Tens uma nova notificação.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.jpeg",
      badge: "/icon.jpeg",
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: "giseveral-push",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  const origin = self.location.origin;

  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of list) {
      if (new URL(client.url).origin === origin && "focus" in client) {
        return client.navigate(targetUrl).then(() => client.focus());
      }
    }
    return self.clients.openWindow(targetUrl);
  })());
});

// Intentionally NO fetch listener. Requests go to network untouched.
