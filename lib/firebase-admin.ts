import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let _app: App | undefined;
let _messaging: Messaging | undefined;

export function getAdminMessaging(): Messaging {
  if (_messaging) return _messaging;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin: faltan vars de entorno. " +
      "Verificá FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local"
    );
  }

  const apps = getApps();
  _app = apps.length > 0
    ? apps[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });

  _messaging = getMessaging(_app);
  return _messaging;
}
