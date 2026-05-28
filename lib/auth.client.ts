"use client";
import { supabaseClient } from "@/lib/supabase";

export async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = "/";
}
