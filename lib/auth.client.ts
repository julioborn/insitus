"use client";
import { supabaseClient } from "@/lib/supabase";

export async function signOut() {
  // Desactivar presencia antes de cerrar sesión (mientras la sesión aún es válida)
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } catch {}
  await supabaseClient.auth.signOut();
  window.location.href = "/";
}
