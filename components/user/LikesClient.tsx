"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { SkeletonList } from "@/components/ui/Skeletons";
import Link from "next/link";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase";

interface MatchProfile {
  id: string; name: string | null; first_name: string | null;
  avatar_url: string | null; username: string | null;
}

interface MatchRow {
  id: string; user_a: string; user_b: string; created_at: string;
  new_for_a: boolean; new_for_b: boolean;
  user_a_profile: MatchProfile; user_b_profile: MatchProfile;
}

export function LikesClient({ userId }: { userId: string }) {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then(r => r.json())
      .then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false); });

    fetch("/api/matches/seen", { method: "POST" });
  }, []);

  useEffect(() => {
    const channel = supabaseClient
      .channel("likes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        fetch("/api/matches").then(r => r.json()).then(d => {
          if (Array.isArray(d)) setMatches(d);
        });
      })
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, []);

  function getOther(match: MatchRow): MatchProfile {
    return match.user_a === userId ? match.user_b_profile : match.user_a_profile;
  }

  function isNew(match: MatchRow): boolean {
    return match.user_a === userId ? match.new_for_a : match.new_for_b;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 className="text-xl font-bold text-white">Likes</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {matches.length} {matches.length === 1 ? "conexión" : "conexiones"}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {loading ? (
          <SkeletonList count={4} />
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: "radial-gradient(circle, #8296E3, transparent)" }} />
              <span className="text-4xl relative z-10">💫</span>
            </div>
            <div>
              <p className="text-white font-semibold text-base">Sin conexiones todavía</p>
              <p className="text-white/40 text-sm mt-1">Cuando haya like mutuo aparecerá acá.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map(match => {
              const other = getOther(match);
              const displayName = other?.name ?? other?.first_name ?? "Usuario";
              const initial = displayName[0]?.toUpperCase() ?? "?";
              const matchIsNew = isNew(match);

              return (
                <Link key={match.id} href={`/chat/${match.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl active:scale-[0.99] transition-all"
                  style={{
                    background: matchIsNew ? "rgba(130,150,227,0.08)" : "rgba(255,255,255,0.05)",
                    border: matchIsNew ? "1px solid rgba(130,150,227,0.25)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div className="flex-shrink-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden"
                      style={{ border: "1.5px solid rgba(130,150,227,0.4)" }}>
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt={displayName} fill sizes="48px" className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                          {initial}
                        </div>
                      )}
                    </div>
                    {matchIsNew && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF3B30]"
                        style={{ border: "2px solid #000" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                    {other?.username && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>@{other.username}</p>
                    )}
                    {matchIsNew && (
                      <p className="text-xs mt-0.5" style={{ color: "#8296E3" }}>¡Nueva conexión!</p>
                    )}
                  </div>

                  <span className="text-white/20 text-xl flex-shrink-0">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
