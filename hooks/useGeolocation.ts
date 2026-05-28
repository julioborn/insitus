"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import { haversineDistance, isInsideVenueRadius, isVenueOpen, getVenueCloseDateTime } from "@/lib/geo";
import type { Venue } from "@/lib/supabase";

interface GeoState {
  coords: GeolocationCoordinates | null;
  error: string | null;
  isLoading: boolean;
  isInsideVenue: boolean;
  distance: number | null;
  activeVenue: Venue | null;
}

export function useGeolocation(userId: string | null) {
  const [state, setState] = useState<GeoState>({
    coords: null, error: null, isLoading: true,
    isInsideVenue: false, distance: null, activeVenue: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const presenceIdRef = useRef<string | null>(null);
  const wasInsideRef = useRef<boolean>(false);

  const deactivatePresence = useCallback(async () => {
    if (!presenceIdRef.current || !userId) return;
    await supabaseClient
      .from("presences")
      .update({ is_active: false })
      .eq("id", presenceIdRef.current);
    presenceIdRef.current = null;
    wasInsideRef.current = false;
  }, [userId]);

  const activatePresence = useCallback(async (venue: Venue) => {
    if (!userId) return;
    const expires = getVenueCloseDateTime(venue);
    const { data } = await supabaseClient
      .from("presences")
      .upsert(
        { user_id: userId, venue_id: venue.id, is_active: true, expires_at: expires?.toISOString() ?? null },
        { onConflict: "user_id,venue_id" }
      )
      .select("id")
      .single();
    if (data) presenceIdRef.current = data.id;
    wasInsideRef.current = true;
  }, [userId]);

  const checkLocation = useCallback(async (coords: GeolocationCoordinates) => {
    if (!userId) return;

    const { data: venues } = await supabaseClient.from("venues").select("*").eq("is_open", true);
    if (!venues || venues.length === 0) {
      if (wasInsideRef.current) await deactivatePresence();
      setState(s => ({ ...s, isInsideVenue: false, distance: null, activeVenue: null, isLoading: false }));
      return;
    }

    // Encontrar el venue más cercano
    let nearest: Venue | null = null;
    let minDist = Infinity;
    for (const venue of venues as Venue[]) {
      const d = haversineDistance(coords.latitude, coords.longitude, venue.lat, venue.lng);
      if (d < minDist) { minDist = d; nearest = venue; }
    }

    const inside = nearest
      ? isInsideVenueRadius(coords.latitude, coords.longitude, nearest) && isVenueOpen(nearest)
      : false;

    if (inside && nearest) {
      // Entró o sigue dentro
      if (!wasInsideRef.current) {
        await activatePresence(nearest);
      }
      setState(s => ({ ...s, isInsideVenue: true, distance: minDist, activeVenue: nearest, isLoading: false, error: null }));
    } else {
      // Salió o está afuera
      if (wasInsideRef.current) {
        await deactivatePresence();
      }
      setState(s => ({ ...s, isInsideVenue: false, distance: minDist === Infinity ? null : minDist, activeVenue: null, isLoading: false, error: null }));
    }
  }, [userId, activatePresence, deactivatePresence]);

  useEffect(() => {
    if (!userId) return;

    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", isLoading: false }));
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState(s => ({ ...s, coords: pos.coords }));
        checkLocation(pos.coords);
      },
      (err) => setState(s => ({ ...s, error: err.message, isLoading: false })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      deactivatePresence();
    };
  }, [userId, checkLocation, deactivatePresence]);

  return state;
}
