"use client";

import { useEffect } from "react";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function vapidKeyToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new DataView(buf);
  for (let i = 0; i < raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
  return buf;
}

function keyToBase64(key: ArrayBuffer | null): string {
  if (!key) return "";
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(key))));
}

async function saveSubscription(subscription: PushSubscription) {
  await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: keyToBase64(subscription.getKey("p256dh")),
      auth: keyToBase64(subscription.getKey("auth")),
      userAgent: navigator.userAgent,
    }),
  });
}

export function PushSubscriptionManager() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !vapidPublicKey
    ) {
      return;
    }

    async function setup() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        if (Notification.permission !== "granted") return;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await saveSubscription(existing);
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyToArrayBuffer(vapidPublicKey),
        });

        await saveSubscription(subscription);
      } catch {
        // Silent fail — push not critical
      }
    }

    setup();
  }, []);

  return null;
}
