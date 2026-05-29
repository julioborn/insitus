"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";

export function MatchFlash({ userId }: { userId: string }) {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`match-flash:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches", filter: `user_b=eq.${userId}` }, triggerFlash)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches", filter: `user_a=eq.${userId}` }, triggerFlash)
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId]);

  function triggerFlash() {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 2200);
  }

  if (!flashing) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Borde que se cierra hacia el centro */}
      <div style={{
        position: "absolute",
        inset: 0,
        border: "4px solid #FF3B30",
        animation: "matchBorderClose 1.4s ease-in forwards",
        borderRadius: 0,
      }} />

      {/* Corazón que aparece en el centro y se expande */}
      <svg
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 120,
          height: 120,
          fill: "#FF3B30",
          filter: "drop-shadow(0 0 24px rgba(255,59,48,0.7))",
          animation: "matchHeartPop 2.2s ease-out forwards",
          animationDelay: "0.5s",
          opacity: 0,
        }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
  );
}
