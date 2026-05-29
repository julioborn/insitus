"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

interface OtherProfile {
  id: string; name: string | null; first_name: string | null;
  avatar_url: string | null; username: string | null;
}

interface Message {
  id: string; match_id: string; sender_id: string;
  content: string; read_at: string | null; created_at: string;
}

interface Props { matchId: string; userId: string }

export function ChatClient({ matchId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchIdRef = useRef(matchId);

  // Cargar perfil del otro usuario y marcar mensajes como leídos
  useEffect(() => {
    supabaseClient
      .from("matches")
      .select("user_a, user_b, user_a_profile:profiles!matches_user_a_fkey(id,name,first_name,avatar_url,username), user_b_profile:profiles!matches_user_b_fkey(id,name,first_name,avatar_url,username)")
      .eq("id", matchId).single()
      .then(({ data }) => {
        if (!data) return;
        const profile = data.user_a === userId
          ? (data.user_b_profile as unknown as OtherProfile)
          : (data.user_a_profile as unknown as OtherProfile);
        setOther(profile);
      });

    // Resetear has_new_message al abrir el chat
    supabaseClient
      .from("matches")
      .update({ has_new_message: false })
      .eq("id", matchId);
  }, [matchId, userId]);

  // Cargar mensajes iniciales
  useEffect(() => {
    supabaseClient
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [matchId]);

  // Al SALIR del chat, borrar mensajes recibidos via API con keepalive
  useEffect(() => {
    return () => {
      fetch("/api/messages/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: matchIdRef.current }),
        keepalive: true, // sobrevive a la navegación/desmontaje
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabaseClient
      .channel(`chat:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as Message).id));
        }
      )
      .on("broadcast", { event: "typing" }, () => {
        setIsTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      })
      .subscribe();

    return () => { supabaseClient.removeChannel(channel); };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping() {
    supabaseClient.channel(`chat:${matchId}`).send({ type: "broadcast", event: "typing", payload: {} });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, content: text.trim() }),
    });
    setText("");
    setSending(false);
  }

  const displayName = other?.name ?? other?.first_name ?? "Match";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/matches" className="text-white/60 text-xl px-1">‹</Link>
        <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: "1.5px solid rgba(130,150,227,0.4)" }}>
          {other?.avatar_url ? (
            <Image src={other.avatar_url} alt={displayName} fill sizes="36px" className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>{initial}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{displayName}</p>
          {other?.username && <p className="text-white/40 text-xs">@{other.username}</p>}
          {isTyping && <p className="text-[#8296E3] text-xs animate-pulse">Escribiendo...</p>}
        </div>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center pb-8">
            <span className="text-3xl">💬</span>
            <p className="text-white/40 text-sm">¡Empezá la conversación!</p>
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm"
                style={mine
                  ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff", borderBottomRightRadius: "6px" }
                  : { background: "rgba(255,255,255,0.08)", color: "#fff", borderBottomLeftRadius: "6px" }
                }>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}>
        <input value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          placeholder="Escribí un mensaje..."
          className="flex-1 px-4 py-2.5 rounded-full text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }} />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
