import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ar.com.insitus.app",
  appName: "Insitus",
  // Carga la app desde producción (SSR en Vercel)
  server: {
    url: "https://www.insitus.com.ar",
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: "insitus-release.keystore",
      keystoreAlias: "insitus",
    },
  },
};

export default config;
