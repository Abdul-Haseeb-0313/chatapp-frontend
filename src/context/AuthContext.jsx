import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on first load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        // Token invalid or expired – clean up
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  // ----- LOGIN -----
  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    const { data: userData } = await api.get("/auth/me");
    setUser(userData);
  }, []);

  // ----- SIGNUP -----
  const signup = useCallback(async (username, email, password) => {
    // 1. Create account and receive token
    const { data } = await api.post("/auth/signup", {
      username,
      email,
      password,
    });

    // 2. Store token so it’s available for the next request
    localStorage.setItem("token", data.token);

    // 3. Fetch full user profile – must succeed to confirm signup
    try {
      const { data: userData } = await api.get("/auth/me");
      setUser(userData);
    } catch (profileErr) {
      // If /auth/me fails, the token might be invalid – clean up and throw
      localStorage.removeItem("token");
      throw new Error(
        profileErr.response?.data?.message ||
          "Account created but profile fetch failed. Please log in."
      );
    }
  }, []);

  // ----- LOGOUT -----
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore – local cleanup is enough
    }
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = { user, loading, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for easy access
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
