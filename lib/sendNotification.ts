import { fcmAdmin } from "@/lib/firebase-admin";

interface Payload {
  token: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification({ token, title, body, url = "/home", tag = "insitus" }: Payload) {
  try {
    await fcmAdmin.send({
      token,
      notification: { title, body },
      data: { url, tag },
      webpush: {
        notification: {
          icon:      "/iconofinal.png",
          badge:     "/iconofinal.png",
          tag,
          renotify:  true,
        },
        fcmOptions: { link: url },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
          },
        },
      },
    });
  } catch {
    // Token expirado o inválido — fallo silencioso
  }
}
