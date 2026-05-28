import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MatchesClient } from "@/components/user/MatchesClient";

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <MatchesClient userId={session.user.id} />;
}
