import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { getUserRole } from "@/lib/roles";
import { AdminClient } from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const role = await getUserRole(session.user.id);
  if (role !== "superadmin") redirect("/home");
  return <AdminClient />;
}
