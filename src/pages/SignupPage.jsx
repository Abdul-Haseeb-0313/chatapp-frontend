import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function SignupPage() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password)
      return setError("Please fill all fields");
    setLoading(true);
    try {
      await signup(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen grid place-items-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl border p-8 shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--panel)" }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={48} />
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Start chatting with your team in seconds.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="janedoe"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--primary)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      />
    </label>
  );
}
