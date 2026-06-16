import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const uid = session.user.id;
  const result: Record<string, unknown> = {};

  // 1. Verificar env vars de Firebase Admin
  result.env = {
    FIREBASE_PROJECT_ID:    process.env.FIREBASE_PROJECT_ID    ? "✓ presente" : "✗ FALTA",
    FIREBASE_CLIENT_EMAIL:  process.env.FIREBASE_CLIENT_EMAIL  ? "✓ presente" : "✗ FALTA",
    FIREBASE_PRIVATE_KEY:   process.env.FIREBASE_PRIVATE_KEY
      ? `✓ presente (${process.env.FIREBASE_PRIVATE_KEY.length} chars, empieza con "${process.env.FIREBASE_PRIVATE_KEY.slice(0, 20)}...")`
      : "✗ FALTA",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "✗ FALTA",
  };

  // 2. Verificar token FCM guardado en el perfil
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("push_subscription")
    .eq("id", uid)
    .single();

  const sub = profile?.push_subscription as { fcm_token?: string } | null;
  result.fcm_token_saved = sub?.fcm_token
    ? `✓ token guardado (…${sub.fcm_token.slice(-12)})`
    : "✗ sin token — el usuario no activó notificaciones o no se guardó";

  // 3. Intentar inicializar Firebase Admin
  try {
    const { getAdminMessaging } = await import("@/lib/firebase-admin");
    getAdminMessaging();
    result.firebase_admin_init = "✓ inicializado correctamente";
  } catch (err) {
    result.firebase_admin_init = `✗ ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 4. Si hay token, intentar enviar notificación de prueba
  if (sub?.fcm_token) {
    try {
      const { sendPushNotification } = await import("@/lib/sendNotification");
      await sendPushNotification({
        token: sub.fcm_token,
        title: "✓ Prueba Insitus",
        body:  "Si ves esto, las notificaciones funcionan correctamente",
        url:   "/home",
        tag:   "test",
      });
      result.test_send = "✓ notificación enviada — revisá tu dispositivo";
    } catch (err) {
      result.test_send = `✗ ERROR al enviar: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    result.test_send = "⚠ saltado — no hay token guardado";
  }

  return NextResponse.json(result, { status: 200 });
}
