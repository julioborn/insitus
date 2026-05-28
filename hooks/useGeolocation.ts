"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import { isInsideVenueRadius, isVenueOpen, getVenueCloseDateTime } from "@/lib/geo";
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

  const updatePresence = useCallback(async (venue: Venue, coords: GeolocationCoordinates) => {
    if (!userId) return;
    const { isInsideVenueRadius: inside } = await import("@/lib/geo").then(m => ({ isInsideVenueRadius: m.isInsideVenueRadius }));
    const inRadius = inside(coords.latitude, coords.longitude, venue);
    const open = isVenueOpen(venue);

    if (inRadius && open) {
      const expires = getVenueCloseDateTime(venue);
      const { data } = await supabaseClient
        .from("presences")
        .upsert({ user_id: userId, venue_id: venue.id, is_active: true, expires_at: expires?.toISOString() ?? null }, { onConflict: "user_id,venue_id" })
        .select("id").single();
      if (data) presenceIdRef.current = data.id;
    } else if (presenceIdRef.current) {
      await supabaseClient.from("presences").update({ is_active: false }).eq("id", presenceIdRef.current);
      presenceIdRef.current = null;
    }
  }, [userId]);

  const checkNearbyVenues = useCallback(async (coords: GeolocationCoordinates) => {
    const { data: venues } = await supabaseClient.from("venues").select("*");
    if (!venues) return;

    let nearest: Venue | null = null;
    let minDist = Infinity;

    for (const venue of venues) {
      const { haversineDistance } = await import("@/lib/geo");
      const d = haversineDistance(coords.latitude, coords.longitude, venue.lat, venue.lng);
      if (d < minDist) { minDist = d; nearest = venue as Venue; }
    }

    const inside = nearest ? isInsideVenueRadius(coords.latitude, coords.longitude, nearest) && isVenueOpen(nearest) : false;
    setState(s => ({ ...s, isInsideVenue: inside, distance: minDist === Infinity ? null : minDist, activeVenue: inside ? nearest : null }));

    if (nearest && inside) await updatePresence(nearest, coords);
  }, [updatePresence]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", isLoading: false }));
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState(s => ({ ...s, coords: pos.coords, error: null, isLoading: false }));
        checkNearbyVenues(pos.coords);
      },
      (err) => setState(s => ({ ...s, error: err.message, isLoading: false })),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (presenceIdRef.current && userId) {
        supabaseClient.from("presences").update({ is_active: false }).eq("id", presenceIdRef.current);
      }
    };
  }, [checkNearbyVenues, userId]);

  return state;
}
