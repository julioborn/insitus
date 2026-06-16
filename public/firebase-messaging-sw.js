importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyCYgB05SNVU-Bo40eWuE31pMRg80gQ1x8Y",
  authDomain:        "insitus-e0beb.firebaseapp.com",
  projectId:         "insitus-e0beb",
  storageBucket:     "insitus-e0beb.firebasestorage.app",
  messagingSenderId: "1015369738643",
  appId:             "1:1015369738643:web:6a98019ee1a8f3a0e82066",
});

const messaging = firebase.messaging();

// Notificaciones en background (app cerrada o en segundo plano)
messaging.onBackgroundMessage((payload) => {
  const { title = "Insitus", body = "" } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon:      "/iconofinal.png",
    badge:     "/iconofinal.png",
    tag:       payload.data?.tag ?? "insitus-notification",
    renotify:  true,
    data:      payload.data ?? {},
  });
});

// Click en notificación → abrir/enfocar la app en la URL correcta
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/home";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        for (const win of wins) {
          if (win.url.startsWith(self.location.origin) && "focus" in win) {
            win.focus();
            win.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
