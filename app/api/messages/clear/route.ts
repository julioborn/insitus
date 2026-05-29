import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false });
  const uid = session.user.id;

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ ok: false });

  // Verificar que el usuario es parte del match
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ ok: false });

  // Borrar mensajes que el usuario recibió (del otro)
  const otherId = match.user_a === uid ? match.user_b : match.user_a;

  await supabaseAdmin
    .from("messages")
    .delete()
    .eq("match_id", matchId)
    .eq("sender_id", otherId);

  return NextResponse.json({ ok: true });
}
