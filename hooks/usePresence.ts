"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile, Presence } from "@/lib/supabase";

export interface PresenceWithProfile extends Presence {
  profiles: Profile;
}

export function usePresence(venueId: string | null) {
  const [presences, setPresences] = useState<PresenceWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!venueId) { setPresences([]); setIsLoading(false); return; }

    const fetchPresences = async () => {
      const { data } = await supabaseClient
        .from("presences")
        .select("*, profiles(*)")
        .eq("venue_id", venueId)
        .eq("is_active", true);
      setPresences((data as PresenceWithProfile[]) ?? []);
      setIsLoading(false);
    };

    fetchPresences();

    const channel = supabaseClient
      .channel(`presences:${venueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "presences", filter: `venue_id=eq.${venueId}` }, () => {
        fetchPresences();
      })
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [venueId]);

  return { presences, isLoading };
}
