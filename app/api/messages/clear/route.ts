import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

// Llamado al ABRIR el chat — resetea el badge de notificación
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false });

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ ok: false });

  await supabaseAdmin
    .from("matches")
    .update({ has_new_message: false })
    .eq("id", matchId);

  return NextResponse.json({ ok: true });
}

// Llamado al SALIR del chat — borra mensajes recibidos y resetea badge
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false });
  const uid = session.user.id;

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ ok: false });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ ok: false });

  const otherId = match.user_a === uid ? match.user_b : match.user_a;

  // Borrar mensajes recibidos
  await supabaseAdmin
    .from("messages")
    .delete()
    .eq("match_id", matchId)
    .eq("sender_id", otherId);

  // Resetear badge
  await supabaseAdmin
    .from("matches")
    .update({ has_new_message: false })
    .eq("id", matchId);

  return NextResponse.json({ ok: true });
}
