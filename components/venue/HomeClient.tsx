"use client";
import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePresence } from "@/hooks/usePresence";
import { UserCard } from "@/components/user/UserCard";
import { BottomNav } from "@/components/ui/BottomNav";

interface Props { userId: string }

export function HomeClient({ userId }: Props) {
  const { isInsideVenue, activeVenue, error, isLoading } = useGeolocation(userId);
  const { presences } = usePresence(isInsideVenue && activeVenue ? activeVenue.id : null);
  const [viewingPeople, setViewingPeople] = useState(false);

  const others = presences.filter(p => p.user_id !== userId);
  const totalInside = presences.length;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="text-lg font-bold tracking-[0.12em] text-white">Incontro</span>
        {isInsideVenue && activeVenue && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60">{activeVenue.name}</span>
          </div>
        )}
        <div className="w-8" />
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">

        {/* Cargando ubicación */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#8296E3] border-t-transparent animate-spin" />
            <p className="text-white/40 text-sm">Detectando ubicación...</p>
          </div>
        )}

        {/* Sin permiso de ubicación */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
            <span className="text-4xl">📍</span>
            <p className="text-white font-medium">Permiso de ubicación requerido</p>
            <p className="text-white/40 text-sm">Activá la ubicación para poder conectarte con quienes están cerca.</p>
          </div>
        )}

        {/* No está en ningún establecimiento */}
        {!isLoading && !error && !isInsideVenue && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-8">
            <span className="text-4xl">🌙</span>
            <p className="text-white font-medium">No estás en ningún lugar</p>
            <p className="text-white/40 text-sm">Cuando estés cerca de un establecimiento asociado, aparecerá acá.</p>
          </div>
        )}

        {/* Está en un establecimiento */}
        {!isLoading && !error && isInsideVenue && activeVenue && (
          <div className="flex flex-col gap-4 animate-fade-in">

            {/* Card del establecimiento */}
            {!viewingPeople && (
              <div
                className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setViewingPeople(true)}
              >
                {/* Banner superior */}
                <div className="h-32 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(130,150,227,0.3), rgba(71,98,199,0.3))" }}>
                  <span className="text-5xl">🎉</span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{activeVenue.name}</p>
                      {activeVenue.address && (
                        <p className="text-white/40 text-xs mt-0.5">{activeVenue.address}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full text-green-400 bg-green-400/10 flex-shrink-0 ml-2">
                      Abierto
                    </span>
                  </div>

                  {/* Contador */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-1.5">
                      {[...Array(Math.min(totalInside, 4))].map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-xs"
                          style={{ background: `hsl(${220 + i * 20}, 60%, 55%)` }}
                        >
                          {i < others.length && others[i]?.profiles?.name
                            ? others[i].profiles.name![0].toUpperCase()
                            : "?"}
                        </div>
                      ))}
                      {totalInside > 4 && (
                        <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[10px] text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
                          +{totalInside - 4}
                        </div>
                      )}
                    </div>
                    <p className="text-white/50 text-xs">
                      {totalInside === 0 ? "Sé el primero" : `${totalInside} ${totalInside === 1 ? "persona" : "personas"} adentro`}
                    </p>
                  </div>

                  <button
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
                  >
                    Ver quién está acá →
                  </button>
                </div>
              </div>
            )}

            {/* Grilla de personas */}
            {viewingPeople && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-white font-semibold">{activeVenue.name}</h2>
                    <p className="text-white/40 text-xs mt-0.5">
                      {others.length === 0 ? "Nadie más por ahora" : `${others.length} ${others.length === 1 ? "persona" : "personas"}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingPeople(false)}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    ← Volver
                  </button>
                </div>

                {others.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                    <span className="text-4xl">🎉</span>
                    <p className="text-white font-medium">Sos el primero</p>
                    <p className="text-white/40 text-sm">Esperá a que llegue más gente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {others.map(p => (
                      <UserCard
                        key={p.user_id}
                        profile={p.profiles}
                        currentUserId={userId}
                        venueId={activeVenue.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
