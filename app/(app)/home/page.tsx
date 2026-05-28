import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeClient } from "@/components/venue/HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <HomeClient userId={session.user.id} />;
}
