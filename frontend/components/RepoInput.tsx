"use client";

import { useState } from "react";
import { Github, Loader2, X, CheckCircle2, BookOpen } from "lucide-react";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RepoInfo {
  collection_name: string;
  repo_url: string;
  file_count?: number;
  chunk_count?: number;
}

interface Props {
  onRepoLoaded: (repo: RepoInfo) => void;
  activeRepo: RepoInfo | null;
  onClearRepo: () => void;
}

export default function RepoInput({ onRepoLoaded, activeRepo, onClearRepo }: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleIngest = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("Cloning and indexing repository...");

    try {
      const res = await fetch(`${API_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to ingest repository");

      const repo: RepoInfo = {
        collection_name: data.collection_name,
        repo_url: trimmed,
        file_count: data.meta?.file_count ?? data.file_count,
        chunk_count: data.meta?.chunk_count ?? data.chunk_count,
      };

      setStatus("success");
      setMessage(
        data.status === "already_ingested"
          ? "Repository already indexed — ready to chat!"
          : `Indexed ${repo.file_count ?? "?"} files across ${repo.chunk_count ?? "?"} chunks`
      );
      onRepoLoaded(repo);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) handleIngest();
  };

  const repoShortName = activeRepo?.repo_url.replace("https://github.com/", "");

  return (
    <div className="bg-[var(--bg-secondary)] px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-4xl mx-auto">

        {/* Logo row */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1a2040 0%, #2a3260 100%)", border: "1px solid var(--gold-dim)" }}>
              <BookOpen size={14} style={{ color: "var(--gold)" }} />
            </div>
            <span className="text-lg font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
              GitGuru
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Turn any GitHub repo into a conversation
          </span>
        </div>

        {/* Active repo badge */}
        {activeRepo && (
          <div className="flex justify-center mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
              <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>
                {repoShortName}
              </span>
              <button
                onClick={() => {
                  if (window.confirm(`Remove "${repoShortName}" and clear the chat?`)) onClearRepo();
                }}
                className="ml-0.5 rounded-full p-0.5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                title="Remove repository"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2">
          <div className="input-gold flex-1 flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <Github size={15} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/username/repository"
              className="flex-1 bg-transparent text-sm outline-none font-mono"
              style={{ color: "var(--text-primary)" }}
              disabled={status === "loading"}
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={status === "loading" || !url.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all"
            style={
              status === "loading" || !url.trim()
                ? { background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "not-allowed" }
                : { background: "linear-gradient(135deg, #c9a227 0%, #a07d18 100%)", color: "#07090f", cursor: "pointer" }
            }
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Indexing...
              </span>
            ) : "Load Repo"}
          </button>
        </div>

        {/* Status */}
        {message && (
          <p className="text-xs mt-2.5 flex items-center gap-1.5"
            style={{ color: status === "error" ? "var(--danger)" : "var(--text-secondary)" }}>
            {status === "loading" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
            )}
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
