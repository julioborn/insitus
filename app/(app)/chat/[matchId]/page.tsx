import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const { matchId } = await params;
  return <ChatClient matchId={matchId} userId={session.user.id} />;
}
