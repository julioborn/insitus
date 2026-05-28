"use client";
import { useEffect, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile, Presence } from "@/lib/supabase";

export interface PresenceWithProfile extends Presence {
  profiles: Profile;
}

export function usePresence(venueId: string | null, currentUserId?: string) {
  const [presences, setPresences] = useState<PresenceWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresences = useCallback(async () => {
    if (!venueId) { setPresences([]); setTotalCount(0); setIsLoading(false); return; }

    const { data } = await supabaseClient
      .from("presences")
      .select("*, profiles(*)")
      .eq("venue_id", venueId)
      .eq("is_active", true);

    const all = (data as PresenceWithProfile[]) ?? [];

    // Total excluye al usuario actual
    const othersAll = all.filter(p => p.user_id !== currentUserId);
    setTotalCount(othersAll.length);

    // Visibles = otros + no fantasma
    const visible = othersAll.filter(p => !p.profiles?.ghost_mode);
    setPresences(visible);
    setIsLoading(false);
  }, [venueId, currentUserId]);

  useEffect(() => {
    if (!venueId) { setPresences([]); setTotalCount(0); setIsLoading(false); return; }

    fetchPresences();

    const channel = supabaseClient
      .channel(`presences-venue:${venueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "presences",
        filter: `venue_id=eq.${venueId}`,
      }, fetchPresences)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      }, fetchPresences)
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [venueId, fetchPresences]);

  return { presences, totalCount, isLoading };
}
