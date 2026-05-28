import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { HomeClient } from "@/components/venue/HomeClient";

export default async function HomePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <HomeClient userId={session.user.id} />;
}
