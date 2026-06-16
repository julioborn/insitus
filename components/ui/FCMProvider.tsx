"use client";
import { useEffect } from "react";
import { useFCMToken } from "@/hooks/useFCMToken";
import { firebaseApp } from "@/lib/firebase";

export function FCMProvider({ userId }: { userId: string }) {
  useFCMToken(userId);

  // Notificaciones en primer plano (app abierta)
  // onBackgroundMessage del SW solo corre cuando la app está cerrada/en background.
  // Cuando está abierta, FCM entrega el mensaje al SDK y hay que mostrarlo manualmente.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    let unsubscribe: (() => void) | undefined;

    import("firebase/messaging")
      .then(({ getMessaging, onMessage }) => {
        const messaging = getMessaging(firebaseApp);

        unsubscribe = onMessage(messaging, async (payload) => {
          const title = payload.notification?.title ?? "Insitus";
          const body  = payload.notification?.body  ?? "";
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
