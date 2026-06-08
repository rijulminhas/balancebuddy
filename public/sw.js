// BalanceBuddy Service Worker — v2
const CACHE_NAME = "balancebuddy-v2";
const STATIC_ASSETS = ["/", "/dashboard", "/offline.html"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch (network-first, cache fallback) ────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (url.pathname.startsWith("/_next/static/")) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached ?? caches.match("/offline.html"))
      )
  );
});

// ── Push notification received ───────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "BalanceBuddy", body: event.data.text(), url: "/notifications" };
  }

  const title = data.title ?? "BalanceBuddy";
  const options = {
    body: data.body ?? "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag ?? "balancebuddy-notification",
    renotify: true,
    data: { url: data.url ?? "/notifications" },
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// ── Push subscription change ─────────────────────────────────────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true })
      .then((subscription) => {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))
            ),
            auth: btoa(
              String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))
            ),
          }),
        });
      })
  );
});
