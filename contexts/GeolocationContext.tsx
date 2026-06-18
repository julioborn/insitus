"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import { haversineDistance, isInsideVenueRadius, isVenueOpen, getVenueCloseDateTime } from "@/lib/geo";
import type { Venue } from "@/lib/supabase";

interface GeoState {
  isInsideVenue: boolean;
  activeVenue: Venue | null;
  distance: number | null;
  isLoading: boolean;
  error: string | null;
}

const GeolocationContext = createContext<GeoState>({
  isInsideVenue: false, activeVenue: null, distance: null, isLoading: true, error: null,
});

export function useGeoContext() {
  return useContext(GeolocationContext);
}

export function GeolocationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, setState] = useState<GeoState>({
    isInsideVenue: false, activeVenue: null, distance: null, isLoading: true, error: null,
  });

  const watchIdRef       = useRef<number | null>(null);
  const presenceIdRef    = useRef<string | null>(null);
  const wasInsideRef     = useRef(false);
  const venuesRef        = useRef<Venue[]>([]);
  const lastFetchRef     = useRef(0);
  const userIdRef        = useRef(userId);
  const checkLocationRef = useRef<((coords: GeolocationCoordinates) => Promise<void>) | null>(null);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const loadVenues = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 60_000 && venuesRef.current.length > 0) return;
    const { data } = await supabaseClient.from("venues").select("*");
    if (data) venuesRef.current = data as Venue[];
    lastFetchRef.current = now;
  }, []);

  const deactivatePresence = useCallback(async () => {
    if (!presenceIdRef.current) return;
    await supabaseClient.from("presences").update({ is_active: false }).eq("id", presenceIdRef.current);
    presenceIdRef.current = null;
    wasInsideRef.current = false;
  }, []);

  const activatePresence = useCallback(async (venue: Venue) => {
    const uid = userIdRef.current;
    const expires = getVenueCloseDateTime(venue);
    const { data } = await supabaseClient
      .from("presences")
      .upsert(
        { user_id: uid, venue_id: venue.id, is_active: true, expires_at: expires?.toISOString() ?? null },
        { onConflict: "user_id,venue_id" }
      )
      .select("id").single();
    if (data) presenceIdRef.current = data.id;
    wasInsideRef.current = true;
  }, []);

  const checkLocation = useCallback(async (coords: GeolocationCoordinates) => {
    await loadVenues();
    const venues = venuesRef.current;

    if (!venues.length) {
      if (wasInsideRef.current) await deactivatePresence();
      setState(s => ({ ...s, isInsideVenue: false, distance: null, activeVenue: null, isLoading: false }));
      return;
    }

    let nearest: Venue | null = null;
    let minDist = Infinity;
    let activeVenue: Venue | null = null;
    let smallestRadius = Infinity;

    for (const v of venues) {
      const d = haversineDistance(coords.latitude, coords.longitude, v.lat, v.lng);
      if (d < minDist) { minDist = d; nearest = v; }
      if (isInsideVenueRadius(coords.latitude, coords.longitude, v) && isVenueOpen(v)) {
        if (v.radius_meters < smallestRadius) { smallestRadius = v.radius_meters; activeVenue = v; }
      }
    }

    if (activeVenue) {
      if (!wasInsideRef.current) await activatePresence(activeVenue);
      setState(s => ({ ...s, isInsideVenue: true, distance: minDist === Infinity ? null : minDist, activeVenue, isLoading: false, error: null }));
    } else {
      if (wasInsideRef.current) await deactivatePresence();
      setState(s => ({ ...s, isInsideVenue: false, distance: minDist === Infinity ? null : minDist, activeVenue: null, isLoading: false, error: null }));
    }
  }, [loadVenues, activatePresence, deactivatePresence]);

  // Mantener ref del callback siempre actualizada sin reiniciar el watchPosition
  useEffect(() => { checkLocationRef.current = checkLocation; }, [checkLocation]);

  // watchPosition — solo se inicia/detiene cuando cambia userId
  useEffect(() => {
    if (!userId || !navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", isLoading: false }));
      return;
    }

    loadVenues();

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => checkLocationRef.current?.(pos.coords),
      err => setState(s => ({ ...s, error: err.message, isLoading: false })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    const channel = supabaseClient
      .channel("venues-changes-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "venues" }, () => {
        lastFetchRef.current = 0;
      })
      .subscribe();

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      supabaseClient.removeChannel(channel);
      deactivatePresence();
    };
  // Solo depende de userId — el callback usa ref para no reiniciar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  );
}
