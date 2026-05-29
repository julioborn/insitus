import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { ChatsClient } from "@/components/user/ChatsClient";

export default async function ChatsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <ChatsClient userId={session.user.id} />;
}
