import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { getUserRole } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase.admin";
import { LocalAdminClient } from "@/components/admin/LocalAdminClient";

export default async function MiLocalPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const role = await getUserRole(session.user.id);
  if (role !== "venue_admin" && role !== "superadmin") redirect("/home");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("managed_venue_id")
    .eq("id", session.user.id)
    .single();

  if (!profile?.managed_venue_id) redirect("/home");

  const { data: venue } = await supabaseAdmin
    .from("venues")
    .select("*")
    .eq("id", profile.managed_venue_id)
    .single();

  if (!venue) redirect("/home");

  return <LocalAdminClient venue={venue} userId={session.user.id} />;
}
