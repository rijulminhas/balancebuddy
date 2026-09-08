"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export function EnablePushButton() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  if (!("Notification" in window) || !("PushManager" in window) || !vapidPublicKey) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <BellOff className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-destructive">
          Push notifications are blocked. Enable them in your browser settings.
        </span>
      </div>
    );
  }

  if (permission === "granted") return null;

  async function handleEnable() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Permission denied.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyToArrayBuffer(vapidPublicKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: keyToBase64(sub.getKey("p256dh")),
          auth: keyToBase64(sub.getKey("auth")),
        }),
      });

      toast.success("Push notifications enabled!");
    } catch {
      toast.error("Could not enable push notifications.");
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 gap-3">
      <div className="flex items-center gap-3">
        <Bell className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium">
          Enable push notifications to get alerts even when the app is closed.
        </span>
      </div>
      <Button size="sm" className="shrink-0 rounded-xl" onClick={handleEnable}>
        Enable
      </Button>
    </div>
  );
}
