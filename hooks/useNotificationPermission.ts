"use client";
import { useState, useEffect } from "react";
import { firebaseApp } from "@/lib/firebase";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotifPermission);
  }, []);

  async function enable() {
    if (loading || permission === "denied" || permission === "unsupported") return;
    setLoading(true);
    try {
      const { getMessaging, getToken } = await import("firebase/messaging");
      const messaging = getMessaging(firebaseApp);

      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/firebase-cloud-messaging-push-scope",
      });

      const result =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      setPermission(result as NotifPermission);

      if (result === "granted") {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
        if (token) {
          await fetch("/api/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fcm_token: token }),
          });
        }
      }
    } catch {
      // Falla silenciosamente si el navegador no soporta FCM
    }
    setLoading(false);
  }

  return { permission, loading, enable };
}
