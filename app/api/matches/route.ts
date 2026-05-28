import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { data, error } = await supabaseAdmin
    .from("matches")
    .select("*, user_a_profile:profiles!matches_user_a_fkey(*), user_b_profile:profiles!matches_user_b_fkey(*)")
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to_user, venue_id } = await req.json();
  if (!to_user || !venue_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("likes")
    .insert({ from_user: session.user.id, to_user, venue_id });

  if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if a match was created
  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("id")
    .or(`and(user_a.eq.${session.user.id},user_b.eq.${to_user}),and(user_a.eq.${to_user},user_b.eq.${session.user.id})`)
    .eq("venue_id", venue_id)
    .single();

  return NextResponse.json({ liked: true, matched: !!match, matchId: match?.id ?? null });
}
