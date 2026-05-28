import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { ProfileClient } from "@/components/user/ProfileClient";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const { id } = await params;
  return <ProfileClient profileId={id} currentUserId={session.user.id} />;
}
