import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { LikesClient } from "@/components/user/LikesClient";

export default async function MatchesPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <LikesClient userId={session.user.id} />;
}
