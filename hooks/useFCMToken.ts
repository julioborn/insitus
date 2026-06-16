"use client";
import { useEffect, useRef } from "react";
import { firebaseApp } from "@/lib/firebase";

export function useFCMToken(userId: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!userId || registered.current) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    async function register() {
      try {
        const { getMessaging, getToken } = await import("firebase/messaging");
        const messaging = getMessaging(firebaseApp);

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/firebase-cloud-messaging-push-scope",
        });

        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

        if (permission !== "granted") return;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          registered.current = true;
          await fetch("/api/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fcm_token: token }),
          });
        }
      } catch {
        // Falla silenciosamente si el navegador no soporta FCM
      }
    }

    register();
  }, [userId]);
}
