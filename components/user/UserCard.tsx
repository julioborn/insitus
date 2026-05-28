"use client";
import { useState } from "react";
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

  async function handleLike() {
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
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden aspect-[3/4]"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Avatar */}
      <Link href={`/profile/${profile.id}`} className="flex-1 relative block">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.name ?? "User"} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8296E3]/20 to-[#4762C7]/20">
            <span className="text-4xl text-white/20">
              {(profile.name ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </Link>

      {/* Info */}
      <div className="p-3 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{profile.name ?? "Sin nombre"}</p>
          {profile.age && <p className="text-white/40 text-xs">{profile.age} años</p>}
        </div>
        <button
          onClick={handleLike}
          disabled={liked || loading || profile.id === currentUserId}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: liked ? "linear-gradient(135deg, #8296E3, #4762C7)" : "rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-base">{matched ? "💫" : liked ? "❤️" : "🤍"}</span>
        </button>
      </div>

      {matched && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-black/80 rounded-2xl px-4 py-2 animate-fade-in">
            <p className="text-[#8296E3] text-xs font-bold tracking-wider">¡MATCH!</p>
          </div>
        </div>
      )}
    </div>
  );
}
