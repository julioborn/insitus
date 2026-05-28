"use client";
import { useMatches } from "@/hooks/useRealtime";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";

interface Props { userId: string }

export function MatchesClient({ userId }: Props) {
  const matches = useMatches(userId);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-xl font-bold text-white">Matches</h1>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
          {matches.length} match{matches.length !== 1 ? "es" : ""}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-4xl">💫</span>
            <p className="text-white font-medium">Sin matches todavía</p>
            <p className="text-white/40 text-sm">Cuando haya match mutuo aparecerá acá.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map(match => {
              const otherId = match.user_a === userId ? match.user_b : match.user_a;
              return (
                <Link
                  key={match.id}
                  href={`/chat/${match.id}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
                  >
                    <span className="text-white font-bold">{otherId[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Match</p>
                    <p className="text-white/40 text-xs truncate">Tocá para chatear</p>
                  </div>
                  <span className="text-white/20 text-lg">›</span>
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
