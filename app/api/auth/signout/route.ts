import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function POST() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: true });

  // Desactivar todas las presencias del usuario antes de cerrar sesión
  await supabaseAdmin
    .from("presences")
    .update({ is_active: false })
    .eq("user_id", session.user.id)
    .eq("is_active", true);

  return NextResponse.json({ ok: true });
}
