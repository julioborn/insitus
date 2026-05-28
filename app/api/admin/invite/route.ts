import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { requireRole } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole(session.user.id, ["superadmin"]);

  const { email, venue_id, venue_name } = await req.json();
  if (!email || !venue_id) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  // Crear usuario en Supabase Auth
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: venue_name, role: "venue_admin" },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Crear perfil con rol venue_admin
  await supabaseAdmin.from("profiles").upsert({
    id: authData.user.id,
    email,
    name: venue_name,
    role: "venue_admin",
    managed_venue_id: venue_id,
  });

  return NextResponse.json({ ok: true, tempPassword, userId: authData.user.id });
}
