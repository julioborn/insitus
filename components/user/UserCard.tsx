"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/supabase";

interface Props {
  profile: Profile;
  currentUserId: string;
  venueId: string;
}

export function UserCard({ profile, currentUserId, venueId }: Props) {
  const [liked, setLiked] = useState(false);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beating, setBeating] = useState(false);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked || loading) return;
    setLoading(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user: profile.id, venue_id: venueId }),
    });
    const data = await res.json();
    setLiked(true);
    setMatched(data.matched);
    setLoading(false);
    setBeating(true);
    setTimeout(() => setBeating(false), 600);
  }, [liked, loading, profile.id, venueId]);

  const displayName = profile.name ?? profile.first_name ?? "Sin nombre";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  const age = profile.birth_date ? (() => {
    const b = new Date(profile.birth_date!);
    const today = new Date();
    return today.getFullYear() - b.getFullYear() -
      (today < new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
  })() : null;

  return (
    <Link
      href={`/profile/${profile.id}`}
      className="relative block rounded-3xl overflow-hidden active:scale-[0.97] transition-transform"
      style={{ aspectRatio: "3/4" }}
    >
      {/* Foto de fondo */}
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt={displayName}
          fill
          sizes="50vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
        >
          {initial}
        </div>
      )}

      {/* Gradiente inferior */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 45%, transparent 100%)" }}
      />

      {/* Badge MATCH */}
      {matched && (
        <div
          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white animate-pulse"
          style={{ background: "linear-gradient(135deg, #FF3B30, #FF6B6B)" }}
        >
          ❤️ MATCH
        </div>
      )}

      {/* Info + botón like */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-1.5">
            <p className="text-white font-bold text-sm truncate">{displayName}</p>
            {profile.gender === "hombre" && <span className="text-[11px] font-bold text-blue-400 flex-shrink-0">♂</span>}
            {profile.gender === "mujer"  && <span className="text-[11px] font-bold text-pink-300 flex-shrink-0">♀</span>}
            {profile.gender === "otro"   && <span className="text-[11px] font-bold text-violet-300 flex-shrink-0">⚧</span>}
          </div>
          {age !== null && (
            <p className="text-white/55 text-xs mt-0.5">{age} años</p>
          )}
        </div>

        {profile.id !== currentUserId && (
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-60 ${beating ? "animate-heartbeat" : ""}`}
            style={{
              background: liked
                ? matched
                  ? "#FF3B30"
                  : "linear-gradient(135deg, #8296E3, #4762C7)"
                : "rgba(0,0,0,0.45)",
              border: liked ? "none" : "1.5px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(8px)",
              boxShadow: liked
                ? matched
                  ? "0 0 20px rgba(255,59,48,0.5)"
                  : "0 0 20px rgba(130,150,227,0.45)"
                : "none",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24"
                fill={liked ? "white" : "none"}
                stroke={liked ? "none" : "rgba(255,255,255,0.9)"}
                strokeWidth="1.8">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </Link>
  );
}
