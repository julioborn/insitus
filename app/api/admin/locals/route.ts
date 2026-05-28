import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { requireRole } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole(session.user.id, ["superadmin"]);

  const { data, error } = await supabaseAdmin
    .from("venues")
    .select("*, admin:profiles!venues_id_fkey(id, name, email)")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole(session.user.id, ["superadmin"]);

  const body = await req.json();
  const { name, address, lat, lng, radius_meters, open_days, open_time, close_time } = body;

  const { data, error } = await supabaseAdmin
    .from("venues")
    .insert({ name, address, lat, lng, radius_meters: radius_meters ?? 100, open_days, open_time, close_time })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
