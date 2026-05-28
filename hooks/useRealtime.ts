"use client";
import { useEffect, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { Message, Match } from "@/lib/supabase";

export function useMessages(matchId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabaseClient
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    fetchMessages();

    const channel = supabaseClient
      .channel(`messages:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on("broadcast", { event: "typing" }, () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      })
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [matchId, fetchMessages]);

  return { messages, isTyping, refetch: fetchMessages };
}

export function useMatches(userId: string | null) {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabaseClient
        .from("matches")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setMatches(data ?? []);
    };

    fetch();

    const channel = supabaseClient
      .channel(`matches:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, () => { fetch(); })
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [userId]);

  return matches;
}
