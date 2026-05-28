import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { matchId } = await params;
  return <ChatClient matchId={matchId} userId={session.user.id} />;
}
