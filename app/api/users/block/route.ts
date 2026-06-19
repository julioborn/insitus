import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.admin";
import { getServerSession } from "@/lib/supabase.server";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json();
  if (!blocked_id) return NextResponse.json({ error: "blocked_id required" }, { status: 400 });

  const blocker_id = session.user.id;

  await supabaseAdmin.from("blocked_users").upsert({ blocker_id, blocked_id }, { onConflict: "blocker_id,blocked_id" });

  // Desactivar matches entre ambos usuarios
  await supabaseAdmin.from("matches")
    .update({ is_active: false })
    .or(`and(user_a.eq.${blocker_id},user_b.eq.${blocked_id}),and(user_a.eq.${blocked_id},user_b.eq.${blocker_id})`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json();
  const blocker_id = session.user.id;

  await supabaseAdmin.from("blocked_users").delete()
    .eq("blocker_id", blocker_id)
    .eq("blocked_id", blocked_id);

  return NextResponse.json({ ok: true });
}
