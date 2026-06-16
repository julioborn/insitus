"use client";
import { useEffect, useRef } from "react";
import { firebaseApp } from "@/lib/firebase";

function isCapacitorNative(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

async function saveToken(token: string) {
  await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fcm_token: token }),
  });
}

export function useFCMToken(userId: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!userId || registered.current) return;
    if (typeof window === "undefined") return;

    async function registerNative() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const status = await PushNotifications.checkPermissions();
        if (status.receive !== "granted") return;

        await PushNotifications.addListener("registration", async (token) => {
          registered.current = true;
          await saveToken(token.value);
        });

        await PushNotifications.addListener("registrationError", (err) => {
          console.error("[FCM Native] Registration error:", err);
        });

        await PushNotifications.register();
      } catch {
        // Falla silenciosamente si el plugin no está disponible
      }
    }

    async function registerWeb() {
      if (!("Notification" in window)) return;
      if (!("serviceWorker" in navigator)) return;
      if (Notification.permission !== "granted") return;

      try {
        const { getMessaging, getToken } = await import("firebase/messaging");
        const messaging = getMessaging(firebaseApp);

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/firebase-cloud-messaging-push-scope",
        });

        const token = await getToken(messaging, {
          vapidKey: "BCFmcp7D_p_vMhSH6e0ceqHxaoBY_QEAv5e6Fj2t5RdLL2gGFJ-Ed5dxO3kBKFnsb4zBmV6pJmydIxPz_OZsna0",
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          registered.current = true;
          await saveToken(token);
        }
      } catch {
        // Falla silenciosamente
      }
    }

    if (isCapacitorNative()) {
      registerNative();
    } else {
      registerWeb();
    }
  }, [userId]);
}
