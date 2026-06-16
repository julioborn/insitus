"use client";
import { useState, useEffect, useRef } from "react";
import { firebaseApp } from "@/lib/firebase";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [loading, setLoading] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotifPermission);

    // Pre-registrar el SW en background para que esté listo al presionar Activar
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
      // ⚠️ requestPermission() DEBE ser la primera operación async
      // para que iOS y Android reconozcan el gesto del usuario y
      // muestren el diálogo nativo del sistema operativo.
      const result = await Notification.requestPermission();
      setPermission(result as NotifPermission);

      if (result !== "granted") {
        setLoading(false);
        return;
      }

      // A partir de acá ya tenemos permiso — podemos hacer el setup de Firebase
      const { getMessaging, getToken } = await import("firebase/messaging");
      const messaging = getMessaging(firebaseApp);

      const swReg =
        swRegRef.current ??
        (await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/firebase-cloud-messaging-push-scope",
        }));

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
    } catch (err) {
      console.error("[FCM] enable error:", err);
    }

    setLoading(false);
  }

  return { permission, loading, enable };
}
