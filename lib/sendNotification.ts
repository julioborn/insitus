import { getAdminMessaging } from "@/lib/firebase-admin";

interface Payload {
  token: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification({ token, title, body, url = "/home", tag = "insitus" }: Payload) {
  const appUrl  = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const iconUrl = `${appUrl}/iconofinal.png`;

  try {
    const messaging = getAdminMessaging();

    await messaging.send({
      token,
      notification: { title, body },
      data: { url, tag },
      webpush: {
        notification: {
          icon:     iconUrl,
          badge:    iconUrl,
          tag,
          renotify: true,
        },
        fcmOptions: { link: `${appUrl}${url}` },
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

    console.log(`[FCM] ✓ Enviado: "${title}" → token …${token.slice(-8)}`);
  } catch (err) {
    console.error(`[FCM] ✗ Error al enviar "${title}":`, err);
  }
}
