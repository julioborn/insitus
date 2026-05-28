import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { requireRole } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole(session.user.id, ["venue_admin", "superadmin"]);

  const { venue_id, is_open } = await req.json();

  // Verificar que el venue_admin administra este local
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, managed_venue_id")
    .eq("id", session.user.id)
    .single();

  if (profile?.role === "venue_admin" && profile.managed_venue_id !== venue_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("venues")
    .update({ is_open })
    .eq("id", venue_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole(session.user.id, ["venue_admin", "superadmin"]);

  const body = await req.json();
  const { venue_id, ...updates } = body;

  const allowed = ["name", "address", "lat", "lng", "radius_meters", "open_days", "open_time", "close_time", "logo_url", "zone"];
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabaseAdmin
    .from("venues")
    .update(safeUpdates)
    .eq("id", venue_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
