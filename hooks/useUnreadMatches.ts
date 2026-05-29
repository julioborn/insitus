"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";

export function useUnreadMatches(userId: string | null) {
  const [newMatches, setNewMatches] = useState(0);
  const [newMessages, setNewMessages] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchCounts = async () => {
      const { data } = await supabaseClient
        .from("matches")
        .select("user_a, new_for_a, new_for_b, has_new_message")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .eq("is_active", true);

      if (!data) return;

      const matches = data.filter(m =>
        (m.user_a === userId && m.new_for_a) ||
        (m.user_a !== userId && m.new_for_b)
      ).length;

      const messages = data.filter(m => m.has_new_message).length;

      setNewMatches(matches);
      setNewMessages(messages);
    };

    fetchCounts();

    const channel = supabaseClient
      .channel(`unread:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchCounts)
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId]);

  return { newMatches, newMessages, total: newMatches + newMessages };
}
