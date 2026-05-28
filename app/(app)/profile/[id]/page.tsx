import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileClient } from "@/components/user/ProfileClient";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;
  return <ProfileClient profileId={id} currentUserId={session.user.id} />;
}
