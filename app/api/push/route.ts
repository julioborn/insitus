import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const fcmToken = body?.fcm_token;
  if (!fcmToken) return NextResponse.json({ error: "Missing fcm_token" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ push_subscription: { fcm_token: fcmToken } })
    .eq("id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
