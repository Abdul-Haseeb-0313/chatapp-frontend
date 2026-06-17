import { useMemo, useState } from "react";
import { LogOut, Plus, Search, X } from "lucide-react";
import Logo from "./Logo";
import Avatar from "./Avatar";

export default function Sidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  user,
  onLogout,
  loading,
  unread,
  onlineMap,
  typingMap,
  onClose,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      chats.filter((c) =>
        (c.name || "").toLowerCase().includes(query.toLowerCase())
      ),
    [chats, query]
  );

  return (
    <aside
      className="flex h-full w-full flex-col border-r"
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Logo />
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight">C</div>
          <div className="text-xs text-[var(--muted)]">a calmer chat</div>
        </div>
        <button
          onClick={onNewChat}
          className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:opacity-90"
          style={{ background: "var(--primary)" }}
          title="New chat"
        >
          <Plus size={18} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-full border py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          />
        </div>
      </div>

      {/* Chats */}
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-2">
        {loading ? (
          <div className="p-6 text-sm text-[var(--muted)]">Loading chats…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium">No conversations</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Tap + to start chatting.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((chat) => {
              const active = chat.id === selectedChatId;
              const count = unread[chat.id] || 0;
              const online = !!onlineMap[chat.otherUserId];
              const typing = !!typingMap[chat.id];
              return (
                <li key={chat.id}>
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-black/[0.03]"
                    style={{
                      background: active
                        ? "rgba(255,107,91,0.10)"
                        : "transparent",
                    }}
                  >
                    <Avatar name={chat.name} online={online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {chat.name}
                        </span>
                        {count > 0 && (
                          <span
                            className="ml-auto inline-flex min-w-[20px] h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                            style={{ background: "var(--primary)" }}
                          >
                            {count > 99 ? "99+" : count}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-[var(--muted)] mt-0.5">
                        {typing ? (
                          <span className="text-[var(--primary)] font-medium">
                            typing…
                          </span>
                        ) : (
                          chat.lastMessage || "No messages yet"
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* User */}
      <div
        className="flex items-center gap-3 border-t p-3"
        style={{ borderColor: "var(--border)" }}
      >
        <Avatar name={user?.username} online />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-sm">{user?.username}</div>
          <div className="truncate text-xs text-[var(--muted)]">
            {user?.email}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
