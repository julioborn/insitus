"use client";
import { useEffect } from "react";
import { useFCMToken } from "@/hooks/useFCMToken";
import { firebaseApp } from "@/lib/firebase";

export function FCMProvider({ userId }: { userId: string }) {
  useFCMToken(userId);

  // Notificaciones en primer plano (solo en web — en nativo el plugin Capacitor lo maneja)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Capacitor?.isNativePlatform?.()) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    let unsubscribe: (() => void) | undefined;

    import("firebase/messaging")
      .then(({ getMessaging, onMessage }) => {
        const messaging = getMessaging(firebaseApp);

        unsubscribe = onMessage(messaging, async (payload) => {
          const title = payload.data?.title ?? payload.notification?.title ?? "Insitus";
          const body  = payload.data?.body  ?? payload.notification?.body  ?? "";
          const data  = payload.data ?? {};

          try {
            // Usar el SW para mostrar la notificación nativa (requiere permiso ya otorgado)
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
              body,
              icon:      "/iconofinal.png",
              badge:     "/iconofinal.png",
              tag:       data.tag ?? "insitus",
              data,
            } as NotificationOptions);
          } catch {
            // Fallback: notificación directa del navegador
            if (Notification.permission === "granted") {
              new Notification(title, { body, icon: "/iconofinal.png" });
            }
          }
        });
      })
      .catch(() => {});

    return () => { unsubscribe?.(); };
  }, []);

  return null;
}
