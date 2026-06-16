"use client";
import { useState, useEffect, useRef } from "react";
import { firebaseApp } from "@/lib/firebase";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

function isCapacitorNative(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [loading, setLoading] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isCapacitorNative()) {
      // En app nativa: chequeamos el permiso via plugin de Capacitor
      import("@capacitor/push-notifications").then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then((status) => {
          if (status.receive === "granted") setPermission("granted");
          else if (status.receive === "denied") setPermission("denied");
          else setPermission("default");
        });
      }).catch(() => setPermission("unsupported"));
      return;
    }

    // Flujo web
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotifPermission);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", {
          scope: "/firebase-cloud-messaging-push-scope",
        })
        .then(reg => { swRegRef.current = reg; })
        .catch(() => {});
    }
  }, []);

  async function enable() {
    if (loading || permission === "denied" || permission === "unsupported") return;
    setLoading(true);

    try {
      if (isCapacitorNative()) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const result = await PushNotifications.requestPermissions();
        if (result.receive === "granted") {
          setPermission("granted");
          await PushNotifications.register();
        } else {
          setPermission(result.receive === "denied" ? "denied" : "default");
        }
        setLoading(false);
        return;
      }

      // ⚠️ requestPermission() DEBE ser la primera operación async
      // para que iOS y Android reconozcan el gesto del usuario
      const result = await Notification.requestPermission();
      setPermission(result as NotifPermission);

      if (result !== "granted") {
        setLoading(false);
        return;
      }

      const { getMessaging, getToken } = await import("firebase/messaging");
      const messaging = getMessaging(firebaseApp);

      const swReg =
        swRegRef.current ??
        (await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/firebase-cloud-messaging-push-scope",
        }));

      const token = await getToken(messaging, {
        vapidKey: "BCFmcp7D_p_vMhSH6e0ceqHxaoBY_QEAv5e6Fj2t5RdLL2gGFJ-Ed5dxO3kBKFnsb4zBmV6pJmydIxPz_OZsna0",
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcm_token: token }),
        });
      }
    } catch (err) {
      console.error("[FCM] enable error:", err);
    }

    setLoading(false);
  }

  return { permission, loading, enable };
}
