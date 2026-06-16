import { initializeApp, getApps, getApp } from "firebase/app";

// Estos valores son públicos (van en el JS del cliente igual que en firebase-messaging-sw.js)
const firebaseConfig = {
  apiKey:            "AIzaSyCYgB05SNVU-Bo40eWuE31pMRg80gQ1x8Y",
  authDomain:        "insitus-e0beb.firebaseapp.com",
  projectId:         "insitus-e0beb",
  storageBucket:     "insitus-e0beb.firebasestorage.app",
  messagingSenderId: "1015369738643",
  appId:             "1:1015369738643:web:6a98019ee1a8f3a0e82066",
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
