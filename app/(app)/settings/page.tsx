import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { SettingsClient } from "@/components/user/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <SettingsClient userId={session.user.id} />;
}
