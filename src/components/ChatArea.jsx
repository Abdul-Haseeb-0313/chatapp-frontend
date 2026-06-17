// frontend/src/components/ChatArea.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  MessageCircleHeart,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const fmt = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatArea({
  chatId,
  chatName,
  otherUserId,
  messages,
  loading,
  onSend,
  onTyping,
  onStopTyping,
  online,
  peerTyping,
  onBack,
  onClearChat,
  onDeleteChat,
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const onStopTypingRef = useRef(onStopTyping);
  const textareaRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Keep latest onStopTyping
  useEffect(() => {
    onStopTypingRef.current = onStopTyping;
  }, [onStopTyping]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Auto‑resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  useEffect(() => {
    autoResize();
  }, [text]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chatId, peerTyping]);

  // Reset when changing chats
  useEffect(() => {
    if (isTypingRef.current) {
      onStopTypingRef.current?.();
      isTypingRef.current = false;
    }
    setText("");
    setMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    return () => {
      if (isTypingRef.current) {
        onStopTypingRef.current?.();
        isTypingRef.current = false;
      }
      clearTimeout(typingTimer.current);
    };
  }, [chatId]);

  const statusLine = useMemo(() => {
    if (peerTyping) return "typing…";
    return online ? "Online" : "Offline";
  }, [online, peerTyping]);

  // Empty state
  if (!chatId) {
    return (
      <section
        className="flex h-full flex-1 items-center justify-center p-8"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center max-w-sm">
          <div
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-white shadow-md"
            style={{ background: "linear-gradient(135deg,#ff8a7a,#ff6b5b)" }}
          >
            <MessageCircleHeart />
          </div>
          <h2 className="text-xl font-semibold">Pick a conversation</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Select a chat from the sidebar, or start a new one.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-5 md:hidden inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <ArrowLeft size={16} />
              Show chats
            </button>
          )}
        </div>
      </section>
    );
  }

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTypingRef.current) {
      onTyping?.();
      isTypingRef.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onStopTypingRef.current?.();
      isTypingRef.current = false;
    }, 1500);
  };

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    if (isTypingRef.current) {
      onStopTypingRef.current?.();
      isTypingRef.current = false;
    }
    clearTimeout(typingTimer.current);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  const handleClear = () => {
    if (window.confirm("Clear all messages in this chat?")) {
      onClearChat?.(chatId);
      setMenuOpen(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this entire chat? This cannot be undone.")) {
      onDeleteChat?.(chatId);
      setMenuOpen(false);
    }
  };

  return (
    <section
      className="flex h-full flex-1 flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Avatar name={chatName} online={online} size={40} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{chatName}</div>
          <div
            className="text-xs"
            style={{ color: peerTyping ? "var(--primary)" : "var(--muted)" }}
          >
            {statusLine}
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
            title="More"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-white shadow-lg z-50 py-1 text-sm"
              style={{
                borderColor: "var(--border)",
                background: "var(--panel)",
              }}
            >
              <button
                onClick={handleClear}
                className="w-full text-left px-4 py-2 hover:bg-black/5"
              >
                Clear chat
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 hover:bg-black/5 text-red-500"
              >
                Delete chat
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-6">
        {loading ? (
          <div className="text-center text-sm text-[var(--muted)]">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="font-medium">No messages yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">Say hello 👋</p>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-1.5">
            {messages.map((m, i) => {
              const isOwn = m.senderId === user?.id;
              const prev = messages[i - 1];
              const showName =
                !isOwn && (!prev || prev.senderId !== m.senderId);
              return (
                <li
                  key={m.id || `${m.createdAt}-${i}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[78%]">
                    {showName && (
                      <div className="text-[11px] text-[var(--muted)] mb-0.5 ml-3">
                        {m.senderName}
                      </div>
                    )}
                    <div
                      className="px-4 py-2 text-sm shadow-sm flex flex-col"
                      style={{
                        background: isOwn
                          ? "var(--bubble-me)"
                          : "var(--bubble-other)",
                        color: isOwn ? "white" : "var(--text)",
                        borderRadius: isOwn
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <span>{m.content}</span>
                      <span
                        className={`text-[10px] mt-0.5 flex items-center gap-1 ${
                          isOwn ? "self-end" : "self-start"
                        }`}
                        style={{
                          color: isOwn
                            ? "rgba(255,255,255,0.7)"
                            : "var(--muted)",
                        }}
                      >
                        {fmt(m.createdAt)}
                        {isOwn && m.status === "sending" && (
                          <span className="opacity-70">⏳</span>
                        )}
                        {isOwn && m.status === "queued" && (
                          <span className="text-yellow-300">⏳</span>
                        )}
                        {isOwn && m.status === "failed" && (
                          <span className="text-red-400">⚠️</span>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
            {peerTyping && (
              <li className="flex justify-start">
                <div
                  className="px-4 py-2.5 rounded-2xl shadow-sm"
                  style={{ background: "var(--bubble-other)" }}
                >
                  <TypingDots />
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t p-3"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg)",
            maxHeight: "120px",
            overflowY: "auto",
          }}
        />
        <button
          type="submit"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}
          disabled={!text.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="block h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
          style={{ animation: `bounce 1s ${d}ms infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-3px);opacity:1} }`}</style>
    </div>
  );
}
