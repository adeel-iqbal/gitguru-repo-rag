"use client";

import { useState, useRef, useEffect } from "react";
import { Send, BookOpen } from "lucide-react";
import MessageBubble, { Message, Source } from "./MessageBubble";
import type { RepoInfo } from "./RepoInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  activeRepo: RepoInfo | null;
}

let msgCounter = 0;
const nextId = () => `m-${++msgCounter}`;

const SUGGESTIONS = [
  "What does this project do?",
  "How is the code structured?",
  "What are the main dependencies?",
  "Explain the entry point",
];

export default function ChatWindow({ activeRepo }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const send = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || !activeRepo || loading) return;

    setMessages(prev => [...prev, { id: nextId(), role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection_name: activeRepo.collection_name, question: q, chat_history: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");

      setMessages(prev => [...prev, {
        id: nextId(),
        role: "assistant",
        content: data.answer,
        sources: data.sources as Source[],
      }]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        id: nextId(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* ── Empty state ── */
  if (!activeRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg, #0d1121 0%, #151a2e 100%)", border: "1px solid var(--gold-dim)", boxShadow: "0 0 40px var(--gold-glow)" }}>
            <BookOpen size={28} style={{ color: "var(--gold)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Ask anything about any repository</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Paste a GitHub URL above and start asking</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {["What does this project do?", "How is authentication handled?", "Explain the main entry point", "What are the key dependencies?"].map(q => (
            <span key={q} className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              {q}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ── Chat ── */
  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Suggestions (only when no messages) */}
          {messages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                Repository indexed. What would you like to know?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--gold-dim)";
                      e.currentTarget.style.color = "var(--gold)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} repoUrl={activeRepo.repo_url} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 items-start msg-enter">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--gold-dim)" }}>
                <BookOpen size={13} style={{ color: "var(--gold)" }} />
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderTopLeftRadius: "4px" }}>
                <div className="flex gap-1.5 items-center h-4">
                  <span className="dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold-dim)" }} />
                  <span className="dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold-dim)" }} />
                  <span className="dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold-dim)" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Gold divider */}
      <div className="gold-divider mx-4" />

      {/* Input */}
      <div className="px-4 py-4" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="input-gold flex-1 rounded-xl px-4 py-3 transition-all"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about this repository..."
              rows={1}
              className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed"
              style={{ color: "var(--text-primary)" }}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={input.trim() && !loading
              ? { background: "linear-gradient(135deg, #c9a227 0%, #a07d18 100%)", color: "#07090f", cursor: "pointer" }
              : { background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "not-allowed" }
            }
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          GitGuru &middot; Powered by GPT-4o &middot; Enter to send
        </p>
      </div>
    </div>
  );
}
