import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/axios";

export default function NewChatModal({ isOpen, onClose, onChatCreated }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter an email");
    setLoading(true);
    try {
      const { data } = await api.post("/chat/create", { email: email.trim() });
      onChatCreated(data);
      setEmail("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--panel)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Start a new chat</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Enter the email of the person you'd like to message.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "Creating…" : "Create chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
