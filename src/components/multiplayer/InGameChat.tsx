"use client";

import React, { useState, useEffect, useRef } from "react";
import { multiplayerManager, RoomChatMessage } from "@/lib/multiplayer-room";
import { sanitizeInput } from "@/lib/auth-service";
import { sound } from "@/lib/sound";
import { MessageSquare, Send, X, Smile } from "lucide-react";

interface InGameChatProps {
  className?: string;
}

const QUICK_REACTIONS = ["🔥", "GG", "😂", "👍", "🤯", "💀", "👏", "🎯"];

export const InGameChat: React.FC<InGameChatProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [text, setText] = useState("");
  const [lastSentTime, setLastSentTime] = useState(0);
  const [floatingReaction, setFloatingReaction] = useState<{ id: string; text: string; avatar: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = multiplayerManager.onChat((msg) => {
      setMessages((prev) => [...prev.slice(-30), msg]);
      sound.playClick(850);

      if (msg.isReaction) {
        setFloatingReaction({ id: msg.id, text: msg.text, avatar: msg.avatar });
        setTimeout(() => setFloatingReaction(null), 2500);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeInput(text.trim());
    if (!clean) return;

    const now = Date.now();
    if (now - lastSentTime < 400) return; // Spam throttle
    setLastSentTime(now);

    sound.playClick(600);
    multiplayerManager.sendChatMessage(clean.slice(0, 140));
    setText("");
  };

  const handleSendReaction = (emoji: string) => {
    const now = Date.now();
    if (now - lastSentTime < 300) return;
    setLastSentTime(now);

    sound.playClick(700);
    multiplayerManager.sendChatMessage(emoji, true);
  };

  return (
    <>
      {/* Floating Reaction Animation on Screen */}
      {floatingReaction && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,210,255,0.4)] animate-bounce text-sm font-bold text-white pointer-events-none"
        >
          <span>{floatingReaction.avatar}</span>
          <span className="text-xl">{floatingReaction.text}</span>
        </div>
      )}

      {/* Chat Trigger Button */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => {
            sound.playClick(500);
            setIsOpen(!isOpen);
          }}
          aria-label="Открыть чат комнаты"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Открыть чат комнаты"
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Чат</span>
          {messages.length > 0 && !isOpen && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {/* Chat Drawer Dropdown */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div
              role="region"
              aria-label="Чат комнаты"
              className="absolute right-0 top-12 w-72 sm:w-80 rounded-2xl glass-panel-glow border border-slate-700/80 p-3 shadow-2xl z-40 animate-fadeIn"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-cyan-400" />
                  Чат комнаты
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Закрыть чат"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Reactions Bar (min 44px touch targets) */}
              <div className="flex items-center justify-between gap-1 mb-3 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    aria-label={`Отправить реакцию ${emoji}`}
                    className="min-h-[36px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-sm font-bold hover:scale-120 transition-transform"
                    title={`Отправить ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Messages feed */}
              <div className="h-44 overflow-y-auto space-y-1.5 pr-1 text-xs mb-3">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">Сообщений пока нет...</div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 leading-snug break-words"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                          <span>{m.avatar}</span>
                          <span className="truncate max-w-[120px]">{m.senderName}</span>
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-200">{m.text}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendText} className="flex gap-1.5">
                <input
                  type="text"
                  maxLength={140}
                  placeholder="Написать..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  aria-label="Отправить сообщение"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
};
