"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileCode, User, Bot, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import clsx from "clsx";

export interface Source {
  file: string;
  file_type: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface Props {
  message: Message;
  repoUrl?: string;
}

function buildGithubUrl(repoUrl: string, filePath: string): string {
  const base = repoUrl.replace(/\/$/, "");
  return `${base}/blob/HEAD/${filePath}`;
}

export default function MessageBubble({ message, repoUrl }: Props) {
  const [showSources, setShowSources] = useState(false);
  const sourcesRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  const toggleSources = () => {
    const next = !showSources;
    setShowSources(next);
    if (next) {
      setTimeout(() => {
        sourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
  };

  return (
    <div className={clsx("flex gap-3 msg-enter", isUser ? "flex-row-reverse" : "flex-row")}>

      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={isUser
          ? { background: "linear-gradient(135deg, #1a2040, #2a3260)", border: "1px solid var(--user-bubble-border)" }
          : { background: "var(--bg-elevated)", border: "1px solid var(--gold-dim)" }
        }>
        {isUser
          ? <User size={14} style={{ color: "var(--gold)" }} />
          : <Bot size={14} style={{ color: "var(--gold)" }} />
        }
      </div>

      {/* Content */}
      <div className={clsx("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>

        {/* Bubble */}
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? {
                background: "var(--user-bubble)",
                border: "1px solid var(--user-bubble-border)",
                borderTopRightRadius: "4px",
                color: "var(--text-primary)",
              }
            : {
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderTopLeftRadius: "4px",
                color: "var(--text-primary)",
              }
          }>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                      <pre style={{
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        overflowX: "auto",
                        margin: "8px 0",
                      }}>
                        <code className={clsx("text-xs font-mono", className)}
                          style={{ color: "var(--text-primary)" }} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-primary)", color: "var(--gold-light)", border: "1px solid var(--border)" }}
                        {...props}>
                        {children}
                      </code>
                    );
                  },
                  p({ children }) { return <p className="mb-2 last:mb-0">{children}</p>; },
                  ul({ children }) { return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>; },
                  ol({ children }) { return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>; },
                  strong({ children }) { return <strong style={{ color: "var(--gold-light)", fontWeight: 600 }}>{children}</strong>; },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={toggleSources}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all"
              style={{ color: "var(--text-secondary)", background: showSources ? "var(--bg-elevated)" : "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <FileCode size={12} />
              <span>{message.sources.length} source{message.sources.length > 1 ? "s" : ""}</span>
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showSources && (
              <div ref={sourcesRef} className="mt-2 space-y-1.5 w-full">
                {message.sources.map((src, i) => {
                  const githubUrl = repoUrl ? buildGithubUrl(repoUrl, src.file) : null;
                  return (
                    <div key={i} className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-tertiary)" }}>

                      {/* File header */}
                      <div className="flex items-center justify-between px-3 py-2"
                        style={{ borderBottom: src.snippet ? "1px solid var(--border-subtle)" : "none" }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode size={12} style={{ color: "var(--gold-dim)", flexShrink: 0 }} />
                          <span className="text-xs font-mono truncate" style={{ color: "var(--gold)" }}>
                            {src.file}
                          </span>
                        </div>
                        {githubUrl && (
                          <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ml-2 transition-all"
                            style={{ color: "var(--text-secondary)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = "var(--gold)";
                              e.currentTarget.style.borderColor = "var(--gold-dim)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = "var(--text-secondary)";
                              e.currentTarget.style.borderColor = "var(--border)";
                            }}
                          >
                            <ExternalLink size={10} />
                            <span>View</span>
                          </a>
                        )}
                      </div>

                      {/* Snippet */}
                      {src.snippet && (
                        <pre className="px-3 py-2 text-xs font-mono overflow-x-auto"
                          style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          <code>{src.snippet.slice(0, 220)}{src.snippet.length > 220 ? "…" : ""}</code>
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
