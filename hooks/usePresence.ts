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

    const [{ data }, { data: blockedData }] = await Promise.all([
      supabaseClient.from("presences").select("*, profiles(*)").eq("venue_id", venueId).eq("is_active", true),
      currentUserId
        ? supabaseClient.from("blocked_users").select("blocked_id, blocker_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)
        : Promise.resolve({ data: [] }),
    ]);

    const blockedIds = new Set(
      (blockedData ?? []).flatMap((b: { blocker_id: string; blocked_id: string }) =>
        b.blocker_id === currentUserId ? [b.blocked_id] : [b.blocker_id]
      )
    );

    const all = (data as PresenceWithProfile[]) ?? [];
    const othersAll = all.filter(p => p.user_id !== currentUserId && !blockedIds.has(p.user_id));
    setTotalCount(othersAll.length);

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
