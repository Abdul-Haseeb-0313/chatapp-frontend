// frontend/src/pages/HomePage.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import NewChatModal from "../components/NewChatModal";
import Logo from "../components/Logo";

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const socket = useSocket(token);

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [unread, setUnread] = useState({});
  const [onlineMap, setOnlineMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const pendingMessagesRef = useRef([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  // Load chats
  useEffect(() => {
    if (!user) return;
    api
      .get("/chat")
      .then(({ data }) => {
        const list = data || [];
        setChats(list);
        const u = {};
        list.forEach((c) => {
          u[c.id] = c.unreadCount || 0;
        });
        setUnread(u);
      })
      .catch(console.error)
      .finally(() => setLoadingChats(false));
  }, [user]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChatId || messages[selectedChatId]) return;
    setLoadingMessages(true);
    api
      .get(`/chat/${selectedChatId}/messages`)
      .then(({ data }) =>
        setMessages((p) => ({ ...p, [selectedChatId]: data || [] }))
      )
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedChatId, messages]);

  const markRead = useCallback(
    (chatId) => {
      if (!socket || !chatId) return;
      socket.emit("mark_read", { chatId });
      setUnread((u) => ({ ...u, [chatId]: 0 }));
    },
    [socket]
  );

  useEffect(() => {
    if (selectedChatId) markRead(selectedChatId);
  }, [selectedChatId, markRead]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // ---- Connect & Reconnect ----
    const onConnect = () => {
      setIsConnected(true);
      // Flush queued messages
      const queue = pendingMessagesRef.current;
      if (queue.length > 0) {
        queue.forEach((msg) => socket.emit("send_message", msg));
        pendingMessagesRef.current = [];
      }
      // Request current online statuses (response will be merged)
      socket.emit("get_online_users");
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // ---- Online users response (MERGE, never replace) ----
    const onOnlineUsersList = ({ userIds }) => {
      setOnlineMap((prev) => {
        const newMap = { ...prev };
        userIds.forEach((id) => (newMap[id] = true));
        return newMap;
      });
    };

    // ---- Messages ----
    const onReceive = (msg) => {
      setMessages((prev) => {
        const arr = [...(prev[msg.chatId] || [])];
        if (msg.tempId) {
          const tempIndex = arr.findIndex((m) => m.id === msg.tempId);
          if (tempIndex !== -1) {
            arr[tempIndex] = { ...msg, status: "sent" };
            return { ...prev, [msg.chatId]: arr };
          }
        }
        if (arr.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [msg.chatId]: [...arr, { ...msg, status: "sent" }] };
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === msg.chatId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
            : c
        )
      );

      if (msg.senderId !== user?.id && msg.chatId !== selectedChatId) {
        setUnread((u) => ({ ...u, [msg.chatId]: (u[msg.chatId] || 0) + 1 }));
      } else if (msg.chatId === selectedChatId) {
        socket.emit("mark_read", { chatId: msg.chatId });
      }
    };

    // ---- Presence (real-time updates) ----
    const onOnline = ({ userId }) => {
      setOnlineMap((m) => ({ ...m, [userId]: true }));
    };
    const onOffline = ({ userId }) => {
      setOnlineMap((m) => {
        const n = { ...m };
        delete n[userId];
        return n;
      });
    };

    // ---- Typing ----
    const onTyping = ({ chatId, userId }) => {
      if (userId === user?.id) return;
      setTypingMap((t) => ({ ...t, [chatId]: true }));
    };
    const onStopTyping = ({ chatId, userId }) => {
      if (userId === user?.id) return;
      setTypingMap((t) => {
        const n = { ...t };
        delete n[chatId];
        return n;
      });
    };

    // ---- New chat / Deleted chat ----
    const onNewChat = (chat) => {
      setChats((prev) => {
        if (prev.some((c) => c.id === chat.id)) return prev;
        return [chat, ...prev];
      });
    };
    const onChatDeleted = ({ chatId }) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    };

    // Register all listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_users_list", onOnlineUsersList);
    socket.on("receive_message", onReceive);
    socket.on("user_online", onOnline);
    socket.on("user_offline", onOffline);
    socket.on("user_typing", onTyping);
    socket.on("user_stopped_typing", onStopTyping);
    socket.on("new_chat", onNewChat);
    socket.on("chat_deleted", onChatDeleted);

    // If already connected, trigger manually
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("online_users_list", onOnlineUsersList);
      socket.off("receive_message", onReceive);
      socket.off("user_online", onOnline);
      socket.off("user_offline", onOffline);
      socket.off("user_typing", onTyping);
      socket.off("user_stopped_typing", onStopTyping);
      socket.off("new_chat", onNewChat);
      socket.off("chat_deleted", onChatDeleted);
    };
  }, [socket, user?.id, selectedChatId]);

  const handleSend = useCallback(
    (content) => {
      if (!user || !selectedChatId) return;

      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage = {
        id: tempId,
        chatId: selectedChatId,
        senderId: user.id,
        senderName: user.username,
        content,
        createdAt: new Date().toISOString(),
        status: socket?.connected ? "sending" : "queued",
      };

      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), optimisticMessage],
      }));

      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChatId ? { ...c, lastMessage: content } : c
        )
      );

      if (socket?.connected) {
        socket.emit("send_message", {
          chatId: selectedChatId,
          content,
          tempId,
        });
      } else {
        pendingMessagesRef.current.push({
          chatId: selectedChatId,
          content,
          tempId,
        });
      }
    },
    [selectedChatId, socket, user?.id, user?.username]
  );

  const handleCreated = (chat) => {
    setChats((p) => (p.some((c) => c.id === chat.id) ? p : [chat, ...p]));
    setSelectedChatId(chat.id);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    if (socket) socket.disconnect();
    navigate("/login");
  };

  const handleClearChat = async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}/messages`);
      setMessages((prev) => ({ ...prev, [chatId]: [] }));
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, lastMessage: null } : c))
      );
    } catch (err) {
      console.error("Clear chat failed", err);
      alert("Failed to clear chat");
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}`);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[chatId];
        return next;
      });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
    } catch (err) {
      console.error("Delete chat failed", err);
      alert("Failed to delete chat");
    }
  };

  if (loading || !user) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size={48} />
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  const selected = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="flex h-screen overflow-hidden">
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-sm font-medium">
          You are offline. Messages will be sent when you reconnect.
        </div>
      )}

      <div
        className={`absolute md:static z-30 h-full w-full max-w-sm transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={(id) => {
            setSelectedChatId(id);
            setSidebarOpen(false);
          }}
          onNewChat={() => setModalOpen(true)}
          user={user}
          onLogout={handleLogout}
          loading={loadingChats}
          unread={unread}
          onlineMap={onlineMap}
          typingMap={typingMap}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 h-full">
        <ChatArea
          chatId={selectedChatId}
          chatName={selected?.name || ""}
          otherUserId={selected?.otherUserId}
          messages={messages[selectedChatId] || []}
          loading={loadingMessages}
          onSend={handleSend}
          onTyping={() => socket?.emit("typing", { chatId: selectedChatId })}
          onStopTyping={() =>
            socket?.emit("stop_typing", { chatId: selectedChatId })
          }
          online={!!onlineMap[selected?.otherUserId]}
          peerTyping={!!typingMap[selectedChatId]}
          onBack={() => setSidebarOpen(true)}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      <NewChatModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onChatCreated={handleCreated}
      />
    </div>
  );
}
