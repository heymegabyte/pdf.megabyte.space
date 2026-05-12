import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  plan: "free" | "pro" | "unlimited";
  isAdmin?: boolean;
}

export interface AuthMe {
  user: AuthUser;
  usage: { projectCount: number; projectLimit: number };
}

interface MeResponse {
  user: AuthUser | null;
  usage: AuthMe["usage"] | null;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  me: AuthMe | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as MeResponse;
      if (!json.user || !json.usage) {
        setMe(null);
        setStatus("unauthenticated");
        return;
      }
      setMe({ user: json.user, usage: json.usage });
      setStatus("authenticated");
    } catch {
      setMe(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setMe(null);
      setStatus("unauthenticated");
      window.location.href = "/";
    }
  }, []);

  return <AuthCtx.Provider value={{ status, me, refresh, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
