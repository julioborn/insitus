"use client";
import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/useRealtime";
import { supabaseClient } from "@/lib/supabase";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";

interface Props { matchId: string; userId: string }

export function ChatClient({ matchId, userId }: Props) {
  const { messages, isTyping } = useMessages(matchId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping() {
    supabaseClient.channel(`messages:${matchId}`).send({ type: "broadcast", event: "typing", payload: {} });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/matches" className="text-white/60 text-xl px-1">‹</Link>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
        >
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Match</p>
          {isTyping && <p className="text-[#8296E3] text-xs animate-pulse">Escribiendo...</p>}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-4">
        {messages.map(msg => {
          const mine = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm"
                style={mine
                  ? { background: "linear-gradient(135deg, #8296E3, #4762C7)", color: "#fff", borderBottomRightRadius: "6px" }
                  : { background: "rgba(255,255,255,0.08)", color: "#fff", borderBottomLeftRadius: "6px" }
                }
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 pb-safe-bottom"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }}
      >
        <input
          value={text}
          onChange={e => { setText(e.target.value); handleTyping(); }}
          placeholder="Escribí un mensaje..."
          className="flex-1 px-4 py-2.5 rounded-full text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <button
          type="submit" disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
