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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function ChatClient({ matchId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    supabaseClient
      .from("matches")
      .select("user_a, user_b, user_a_profile:profiles!matches_user_a_fkey(id,name,first_name,avatar_url,username), user_b_profile:profiles!matches_user_b_fkey(id,name,first_name,avatar_url,username)")
      .eq("id", matchId).single()
      .then(({ data }) => {
        if (!data) return;
        const otherProfile = data.user_a === userId
          ? (data.user_b_profile as unknown as OtherProfile)
          : (data.user_a_profile as unknown as OtherProfile);
        const meProfile = data.user_a === userId
          ? (data.user_a_profile as unknown as OtherProfile)
          : (data.user_b_profile as unknown as OtherProfile);
        setOther(otherProfile);
        setMyAvatar(meProfile?.avatar_url ?? null);
        setMyName(meProfile?.name ?? meProfile?.first_name ?? "Yo");
      });
  }, [matchId, userId]);

  useEffect(() => {
    // Cargar mensajes primero, LUEGO borrarlos de la DB (leídos = desaparecen)
    supabaseClient.from("messages").select("*").eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
        fetch(`/api/messages/clear?matchId=${matchId}`);
      });
  }, [matchId]);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`chat:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
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
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      fetch("/api/messages/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: matchIdRef.current }),
        keepalive: true,
      });
    };
  }, []);

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
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#000", overflow: "hidden" }}>

      {/* Header — fijo */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "max(env(safe-area-inset-top), 48px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/chats" className="text-white/60 text-xl px-1">‹</Link>
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
        </div>
      </header>

      {/* Mensajes — único área scrolleable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", overscrollBehavior: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-white/40 text-sm">¡Empezá la conversación!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const mine = msg.sender_id === userId;
            const nextMsg = messages[i + 1];
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const avatarUrl = mine ? myAvatar : other?.avatar_url;
            const avatarName = mine ? myName : (other?.name ?? other?.first_name ?? "");
            const avatarInitial = avatarName[0]?.toUpperCase() ?? "?";

            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: mine ? "row-reverse" : "row" }}>
                  {/* Avatar solo en el último del grupo */}
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {isLastInGroup ? (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt={avatarName} fill sizes="28px" className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                            {avatarInitial}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm"
                    style={mine
                      ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff", borderBottomRightRadius: 6 }
                      : { background: "rgba(255,255,255,0.10)", color: "#fff", borderBottomLeftRadius: 6 }
                    }>
                    {msg.content}
                  </div>
                </div>

                {/* Hora solo en el último del grupo */}
                {isLastInGroup && (
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3, marginLeft: mine ? 0 : 36, marginRight: mine ? 36 : 0 }}>
                    {formatTime(msg.created_at)}
                  </p>
                )}
              </div>
            );
          })}

          {/* Indicador "escribiendo..." */}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 28, flexShrink: 0 }}>
                <div className="relative w-7 h-7 rounded-full overflow-hidden">
                  {other?.avatar_url ? (
                    <Image src={other.avatar_url} alt={displayName} fill sizes="28px" className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
                      {initial}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.10)", borderBottomLeftRadius: 6 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — fijo */}
      <form onSubmit={handleSend}
        className="flex-shrink-0 flex items-center gap-3 px-4 pt-3"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 12px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(20px)",
        }}>
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
