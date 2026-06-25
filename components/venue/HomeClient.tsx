"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useGeoContext } from "@/contexts/GeolocationContext";
import { usePresence } from "@/hooks/usePresence";
import { UserCard } from "@/components/user/UserCard";
import { BottomNav } from "@/components/ui/BottomNav";
import { SkeletonList } from "@/components/ui/Skeletons";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { supabaseClient } from "@/lib/supabase";
import type { Venue } from "@/lib/supabase";

interface Props { userId: string }

function VenueCard({ venue, onView }: { venue: Venue; onView: () => void }) {
  return (
    <div
      className="surface-card rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform flex items-center gap-4"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
      onClick={onView}
    >
      {/* Avatar circular */}
      <div className="flex-shrink-0 relative">
        <div className="w-16 h-16 rounded-full overflow-hidden"
          style={{ border: "2px solid rgba(130,150,227,0.4)", boxShadow: "0 0 16px rgba(130,150,227,0.2)" }}>
          {venue.logo_url ? (
            <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, rgba(130,150,227,0.3), rgba(71,98,199,0.3))" }}>
              🎉
            </div>
          )}
        </div>
        {/* Punto verde de activo */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-black" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base truncate">{venue.name}</p>
        {venue.address && (
          <p className="text-white/40 text-xs mt-0.5 truncate">{venue.address}</p>
        )}
        <p className="text-[11px] font-semibold mt-1.5" style={{ color: "#8296E3" }}>
          Ver quién está acá →
        </p>
      </div>
    </div>
  );
}

export function HomeClient({ userId }: Props) {
  const { isInsideVenue, activeVenues, error, isLoading, distance } = useGeoContext();
  const [viewingVenueId, setViewingVenueId] = useState<string | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const { permission: notifPermission, loading: notifLoading, enable: enableNotif } = useNotificationPermission();

  const viewingVenue = activeVenues.find(v => v.id === viewingVenueId) ?? null;
  const { presences: others, totalCount } = usePresence(viewingVenueId, userId);

  // Si el venue que estábamos viendo desaparece (salimos del lugar), volver atrás
  useEffect(() => {
    if (viewingVenueId && !activeVenues.find(v => v.id === viewingVenueId)) {
      setViewingVenueId(null);
    }
  }, [activeVenues, viewingVenueId]);

  useEffect(() => {
    const dismissed = localStorage.getItem("notif_banner_dismissed");
    if (!dismissed) setBannerDismissed(false);
  }, []);

  function dismissBanner() {
    localStorage.setItem("notif_banner_dismissed", "1");
    setBannerDismissed(true);
  }

  async function handleEnableNotif() {
    await enableNotif();
    dismissBanner();
  }

  useEffect(() => {
    supabaseClient
      .from("profiles")
      .select("ghost_mode")
      .eq("id", userId)
      .single()
      .then(({ data }) => { if (data) setGhostMode(!!data.ghost_mode); });
  }, [userId]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <header className="flex items-center justify-between px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-2xl font-bold tracking-tight"
          style={{ background: "linear-gradient(135deg, #8296E3, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          insitus
        </span>
        <div className="flex items-center gap-2">
          {ghostMode && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              👻 Fantasma
            </span>
          )}
          {isInsideVenue && activeVenues.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-green-400">
                {activeVenues.length === 1 ? activeVenues[0].name : `${activeVenues.length} lugares`}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        {isLoading && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="skeleton h-36 w-full rounded-none" />
              <div className="p-4 flex flex-col gap-3">
                <div className="skeleton h-4 rounded-lg w-40" />
                <div className="skeleton h-3 rounded-lg w-24" />
                <div className="skeleton h-10 rounded-xl w-full mt-1" />
              </div>
            </div>
            <SkeletonList count={3} />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8 animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-25" style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
              <span className="text-4xl relative z-10">📍</span>
            </div>
            <div>
              <p className="text-white font-semibold text-base">Permiso de ubicación requerido</p>
              <p className="text-white/40 text-sm mt-1">Activá la ubicación para conectarte con quienes están cerca.</p>
            </div>
            <button onClick={() => window.location.reload()}
              className="btn-secondary text-xs font-semibold px-4 py-2.5 rounded-full mt-2"
              style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && !isInsideVenue && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8 animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-25" style={{ background: "radial-gradient(circle, #8296E3, transparent)" }} />
              <span className="text-4xl relative z-10">🌙</span>
            </div>
            <div>
              <p className="text-white font-semibold text-base">No estás en ningún lugar</p>
              <p className="text-white/40 text-sm mt-1">Cuando estés cerca de un lugar asociado, aparecerá acá.</p>
              {distance !== null && (
                <p className="text-xs mt-3 px-4 py-2 rounded-full inline-block"
                  style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {distance < 1000
                    ? `A ${Math.round(distance)}m del más cercano`
                    : `A ${(distance / 1000).toFixed(1)}km del más cercano`}
                </p>
              )}
            </div>
            <Link href="/profile/me"
              className="btn-secondary text-xs font-semibold px-4 py-2.5 rounded-full mt-2"
              style={{ background: "rgba(130,150,227,0.12)", border: "1px solid rgba(130,150,227,0.3)", color: "#8296E3" }}>
              Completá tu perfil mientras tanto
            </Link>
          </div>
        )}

        {!isLoading && !error && isInsideVenue && (
          <div className="flex flex-col gap-4 animate-fade-in">

            {/* Modo fantasma */}
            {ghostMode && (
              <div className="rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-4xl">👻</span>
                <p className="text-white font-semibold">Estás en modo fantasma</p>
                <p className="text-white/40 text-sm">
                  Estás en <span className="text-white font-bold">{activeVenues.map(v => v.name).join(", ")}</span>
                </p>
                <p className="text-white/25 text-xs mt-1">Desactivá el modo fantasma desde tu perfil para ver quiénes son.</p>
              </div>
            )}

            {/* Vista normal */}
            {!ghostMode && (
              <>
                {/* Vista de personas de un venue */}
                {viewingVenue ? (
                  <div className="animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-white font-semibold">{viewingVenue.name}</h2>
                        <p className="text-white/40 text-xs mt-0.5">
                          {others.length === 0 ? "Nadie más por ahora" : `${others.length} ${others.length === 1 ? "persona" : "personas"}`}
                        </p>
                      </div>
                      <button onClick={() => setViewingVenueId(null)} className="text-xs text-white/40 hover:text-white/70">
                        ← Volver
                      </button>
                    </div>
                    {others.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center animate-fade-in">
                        <div className="relative flex items-center justify-center w-20 h-20">
                          <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: "radial-gradient(circle, #8296E3, transparent)" }} />
                          <span className="text-4xl relative z-10">🎉</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-base">Sos el primero</p>
                          <p className="text-white/40 text-sm mt-1">Esperá a que llegue más gente.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {others.map(p => (
                          <UserCard key={p.user_id} profile={p.profiles} currentUserId={userId} venueId={viewingVenue.id} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Lista de venues activos */
                  <div className="flex flex-col gap-4">
                    {activeVenues.map(venue => (
                      <VenueCard key={venue.id} venue={venue} onView={() => setViewingVenueId(venue.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {!bannerDismissed && notifPermission === "default" && (
        <div className="fixed bottom-[72px] left-3 right-3 z-40 animate-slide-up"
          style={{ filter: "drop-shadow(0 -4px 24px rgba(0,0,0,0.6))" }}>
          <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ background: "rgba(18,18,24,0.97)", border: "1px solid rgba(130,150,227,0.25)", backdropFilter: "blur(20px)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(130,150,227,0.15)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#8296E3">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Activá las notificaciones</p>
              <p className="text-white/40 text-xs mt-0.5">Enterate cuando alguien te da like</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={dismissBanner}
                className="btn-secondary text-white/30 text-xs px-2 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                Ahora no
              </button>
              <button onClick={handleEnableNotif} disabled={notifLoading}
                className="btn-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                {notifLoading ? "..." : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
