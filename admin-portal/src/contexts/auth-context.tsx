"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AdminSession {
  email: string;
  loginTime: string;
}

interface AuthContextType {
  session: AdminSession | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for cookie management
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    const storedSession = getCookie("admin_session");
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        
        // Check if session is still valid (24 hours)
        if (now.getTime() - loginTime.getTime() < 24 * 60 * 60 * 1000) {
          setSession(sessionData);
          setIsAuthenticated(true);
        } else {
          // Session expired
          deleteCookie("admin_session");
        }
      } catch (error) {
        // Invalid session
        deleteCookie("admin_session");
      }
    }
  }, []);

  const logout = () => {
    deleteCookie("admin_session");
    setSession(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ session, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
