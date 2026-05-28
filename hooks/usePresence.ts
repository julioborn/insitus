"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile, Presence } from "@/lib/supabase";

export interface PresenceWithProfile extends Presence {
  profiles: Profile;
}

export function usePresence(venueId: string | null, currentUserId?: string) {
  const [presences, setPresences] = useState<PresenceWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!venueId) { setPresences([]); setTotalCount(0); setIsLoading(false); return; }

    const fetchPresences = async () => {
      const { data } = await supabaseClient
        .from("presences")
        .select("*, profiles(*)")
        .eq("venue_id", venueId)
        .eq("is_active", true);

      const all = (data as PresenceWithProfile[]) ?? [];
      setTotalCount(all.length);
      // Excluir usuarios en modo fantasma de la lista visible
      const visible = all.filter(p => !p.profiles?.ghost_mode);
      setPresences(visible);
      setIsLoading(false);
    };

    fetchPresences();

    const channel = supabaseClient
      .channel(`presences:${venueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "presences", filter: `venue_id=eq.${venueId}` }, fetchPresences)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, fetchPresences)
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [venueId, currentUserId]);

  return { presences, totalCount, isLoading };
}
