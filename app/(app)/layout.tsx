import { getServerSession } from "@/lib/supabase.server";
import { redirect } from "next/navigation";
import { GeolocationProvider } from "@/contexts/GeolocationContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <GeolocationProvider userId={session.user.id}>
      {children}
    </GeolocationProvider>
  );
}
