"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

type AppMode = "BEGINNER" | "EXPERIENCED";

type AuthContextType = {
  user: { id: string; email: string; name: string | null; role: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  login: (user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>("BEGINNER");

  useEffect(() => {
    // Check for existing session on load
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("aaa_session="));
    if (token) {
      // Session exists on server-rendered HTML; we trust SSR for user data
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (u: { id: string; email: string; name: string | null; role: string }) => {
      setUser(u);
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mode,
        setMode,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
