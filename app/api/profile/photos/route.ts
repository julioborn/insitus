import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("profile_photos")
    .select("*")
    .eq("user_id", session.user.id)
    .order("position");

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, position } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("profile_photos")
    .insert({ user_id: session.user.id, url, position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  await supabaseAdmin
    .from("profile_photos")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  return NextResponse.json({ ok: true });
}
