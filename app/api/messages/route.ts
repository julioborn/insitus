import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .single();

  if (!match) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { matchId, content } = await req.json();
  if (!matchId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .eq("is_active", true)
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .single();

  if (!match) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({ match_id: matchId, sender_id: uid, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
