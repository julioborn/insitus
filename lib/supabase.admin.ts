import { createClient } from "@supabase/supabase-js";

// Server-only admin client — bypasses RLS. Never import this in Client Components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
