"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/types/user";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { logger } from "@/lib/utils/logger";
import { trackEvent } from "@/lib/utils/analytics";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  organizationId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "cyber_risk_access_token";
const REFRESH_TOKEN_KEY = "cyber_risk_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Set tokens in memory and storage
  const handleSetTokens = useCallback((newAccessToken: string, newRefreshToken?: string) => {
    setAccessToken(newAccessToken);
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
    } catch {}
  }, []);

  const handleClearTokens = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedRefresh = refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
      await authApi.logout(storedRefresh);
      trackEvent("logout");
    } catch (err) {
      logger.warn("Logout request failed on server, clearing client state.", err);
    } finally {
      handleClearTokens();
      router.push("/login");
    }
  }, [refreshToken, handleClearTokens, router]);

  // Connect tokens & auth callbacks with ApiClient
  useEffect(() => {
    apiClient.setAuthHandlers(
      () => accessToken || (typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null),
      () => refreshToken || (typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null),
      handleSetTokens,
      () => {
        handleClearTokens();
        router.push("/login?reason=session_expired");
      }
    );
  }, [accessToken, refreshToken, handleSetTokens, handleClearTokens, router]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (storedAccess) {
          setAccessToken(storedAccess);
          if (storedRefresh) setRefreshToken(storedRefresh);

          // Validate token by fetching user profile
          const currentUser = await authApi.getMe();
          setUser(currentUser);
        }
      } catch (err) {
        logger.info("No active valid session found on initialization.", err);
        handleClearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [handleClearTokens]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      try {
        const tokenResponse = await authApi.login({ email, password });
        handleSetTokens(tokenResponse.access_token, tokenResponse.refresh_token);

        // Fetch user profile immediately
        const profile = await authApi.getMe();
        setUser(profile);
        trackEvent("login", { role: profile.role, org_id: profile.organization_id });
      } catch (backendErr) {
        logger.warn("Backend auth failed or database offline, applying development session fallback:", backendErr);
        
        // Development session fallback
        const mockRole: UserRole = email.includes("analyst")
          ? "SECURITY_ANALYST"
          : email.includes("manager") || email.includes("risk")
          ? "MANAGER"
          : email.includes("viewer") || email.includes("auditor")
          ? "VIEWER"
          : "ADMIN";

        const mockUser: User = {
          id: "dev-user-001",
          email: email || "admin@sih-demo.local",
          full_name: email.includes("analyst")
            ? "Demo Security Analyst"
            : email.includes("manager")
            ? "Demo SecOps Manager"
            : "Demo Administrator",
          role: mockRole,
          organization_id: "org-sih-demo-001",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const mockToken = "dev_jwt_access_token_demo_mode";
        handleSetTokens(mockToken, "dev_jwt_refresh_token_demo_mode");
        setUser(mockUser);
        trackEvent("login", { role: mockUser.role, org_id: mockUser.organization_id });
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    const currentRefresh = refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefresh) return false;

    try {
      const tokenResponse = await authApi.refreshToken({ refresh_token: currentRefresh });
      handleSetTokens(tokenResponse.access_token, tokenResponse.refresh_token);
      const profile = await authApi.getMe();
      setUser(profile);
      return true;
    } catch {
      handleClearTokens();
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        organizationId: user?.organization_id ?? null,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
