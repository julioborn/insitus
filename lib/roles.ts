import { supabaseAdmin } from "@/lib/supabase.admin";

export type Role = "superadmin" | "venue_admin" | "user";

export async function getUserRole(userId: string): Promise<Role> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return (data?.role ?? "user") as Role;
}

export async function requireRole(userId: string, allowed: Role[]) {
  const role = await getUserRole(userId);
  if (!allowed.includes(role)) throw new Error("Forbidden");
  return role;
}
