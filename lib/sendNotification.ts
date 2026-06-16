import { getAdminMessaging } from "@/lib/firebase-admin";

interface Payload {
  token: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification({ token, title, body, url = "/home", tag = "insitus" }: Payload) {
  try {
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://insitus.vercel.app";
    const iconUrl = `${appUrl}/iconofinal.png`;
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
  } catch (err) {
    console.error("[FCM] sendPushNotification error:", err);
  }
}
