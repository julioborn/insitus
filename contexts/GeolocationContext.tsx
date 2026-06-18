"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import { haversineDistance, isInsideVenueRadius, isVenueOpen, getVenueCloseDateTime } from "@/lib/geo";
import type { Venue } from "@/lib/supabase";

const TEST_VENUE_ID = "0f40bc58-35bf-497c-93a9-7afd32b057c6";

interface GeoState {
  isInsideVenue: boolean;
  activeVenues: Venue[];
  distance: number | null;
  isLoading: boolean;
  error: string | null;
}

const GeolocationContext = createContext<GeoState>({
  isInsideVenue: false, activeVenues: [], distance: null, isLoading: true, error: null,
});

export function useGeoContext() {
  return useContext(GeolocationContext);
}

export function GeolocationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, setState] = useState<GeoState>({
    isInsideVenue: false, activeVenues: [], distance: null, isLoading: true, error: null,
  });

  const watchIdRef         = useRef<number | null>(null);
  const activePresencesRef = useRef<Map<string, string>>(new Map()); // venueId → presenceId
  const activeVenueIdsRef  = useRef<Set<string>>(new Set());
  const venuesRef          = useRef<Venue[]>([]);
  const lastFetchRef       = useRef(0);
  const userIdRef          = useRef(userId);
  const userIsTestRef      = useRef<boolean>(false);
  const checkLocationRef   = useRef<((coords: GeolocationCoordinates) => Promise<void>) | null>(null);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Detecta si es cuenta tester por email; invalida caché de venues
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      userIsTestRef.current = /^tester\d+@insitus\.com\.ar$/.test(email);
      lastFetchRef.current = 0;
    });
  }, [userId]);

  const loadVenues = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 60_000 && venuesRef.current.length > 0) return;
    const { data } = await supabaseClient.from("venues").select("*");
    if (data) {
      venuesRef.current = (data as Venue[]).filter(v =>
        v.id !== TEST_VENUE_ID || userIsTestRef.current
      );
    }
    lastFetchRef.current = now;
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
    if (data) {
      activePresencesRef.current.set(venue.id, data.id);
      activeVenueIdsRef.current.add(venue.id);
    }
  }, []);

  const deactivatePresenceForVenue = useCallback(async (venueId: string) => {
    const presenceId = activePresencesRef.current.get(venueId);
    if (!presenceId) return;
    await supabaseClient.from("presences").update({ is_active: false }).eq("id", presenceId);
    activePresencesRef.current.delete(venueId);
    activeVenueIdsRef.current.delete(venueId);
  }, []);

  const deactivateAllPresences = useCallback(async () => {
    for (const venueId of [...activeVenueIdsRef.current]) {
      await deactivatePresenceForVenue(venueId);
    }
  }, [deactivatePresenceForVenue]);

  const checkLocation = useCallback(async (coords: GeolocationCoordinates) => {
    await loadVenues();
    const venues = venuesRef.current;

    if (!venues.length) {
      await deactivateAllPresences();
      setState(s => ({ ...s, isInsideVenue: false, activeVenues: [], distance: null, isLoading: false }));
      return;
    }

    let minDist = Infinity;
    const insideVenues: Venue[] = [];

    for (const v of venues) {
      const d = haversineDistance(coords.latitude, coords.longitude, v.lat, v.lng);
      if (d < minDist) minDist = d;
      if (isInsideVenueRadius(coords.latitude, coords.longitude, v) && isVenueOpen(v)) {
        insideVenues.push(v);
      }
    }

    const insideIds = new Set(insideVenues.map(v => v.id));

    // Activar presencias para venues recién entrados
    for (const v of insideVenues) {
      if (!activeVenueIdsRef.current.has(v.id)) await activatePresence(v);
    }

    // Desactivar presencias para venues que ya salió
    for (const vId of [...activeVenueIdsRef.current]) {
      if (!insideIds.has(vId)) await deactivatePresenceForVenue(vId);
    }

    setState(s => ({
      ...s,
      isInsideVenue: insideVenues.length > 0,
      activeVenues: insideVenues,
      distance: minDist === Infinity ? null : minDist,
      isLoading: false,
      error: null,
    }));
  }, [loadVenues, activatePresence, deactivatePresenceForVenue, deactivateAllPresences]);

  useEffect(() => { checkLocationRef.current = checkLocation; }, [checkLocation]);

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
      deactivateAllPresences();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  );
}
