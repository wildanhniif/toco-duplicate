"use client";

import { useState, useEffect } from "react";

interface User {
  user_id: number;
  name: string;
  role: "customer" | "seller" | "admin";
  store_id?: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    // Force redirect to home page immediately
    window.location.href = "/";
  };

  useEffect(() => {
    const checkAuthState = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("auth_token");

      if (!token) {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split(".")[1]));

        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("auth_token");
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }

        // Handle both token formats: direct and nested user object
        const userPayload = payload.user || payload;

        setAuthState({
          user: {
            user_id: userPayload.user_id || userPayload.id,
            name: userPayload.name || userPayload.full_name,
            role: userPayload.role || "customer",
            store_id: userPayload.store_id || null,
          },
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error("Error parsing token:", error);
        localStorage.removeItem("auth_token");
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    checkAuthState();
  }, []);

  // Listen for storage changes (for cross-tab sync and forced refreshes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        console.log(
          "[useAuth] Token changed in storage, refreshing auth state..."
        );
        if (e.newValue) {
          // Re-check auth state when token changes
          const token = e.newValue;
          try {
            // Decode JWT token to get user info
            const payload = JSON.parse(atob(token.split(".")[1]));

            // Check if token is expired
            if (payload.exp * 1000 < Date.now()) {
              logout();
              return;
            }

            // Handle both token formats: direct and nested user object
            const userPayload = payload.user || payload;

            console.log("[useAuth] New auth state:", {
              role: userPayload.role,
              user_id: userPayload.user_id,
              store_id: userPayload.store_id,
            });

            setAuthState({
              user: {
                user_id: userPayload.user_id || userPayload.id,
                name: userPayload.name || userPayload.full_name,
                role: userPayload.role || "customer",
                store_id: userPayload.store_id || null,
              },
              token,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error("Error parsing token:", error);
            logout();
          }
        } else {
          logout();
        }
      }
    };

    // Also listen for custom auth events
    const handleAuthChange = (e: CustomEvent) => {
      console.log("[useAuth] Custom auth event received:", e.detail);
      if (e.detail?.token) {
        handleStorageChange({
          key: "auth_token",
          newValue: e.detail.token,
          oldValue: null,
        } as StorageEvent);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-changed", handleAuthChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "auth-changed",
        handleAuthChange as EventListener
      );
    };
  }, []);

  const updateAuthState = (token: string) => {
    localStorage.setItem("auth_token", token);

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Handle both token formats: direct and nested user object
      const userPayload = payload.user || payload;

      setAuthState({
        user: {
          user_id: userPayload.user_id || userPayload.id,
          name: userPayload.name || userPayload.full_name,
          role: userPayload.role || "customer",
          store_id: userPayload.store_id || null,
        },
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Error parsing token:", error);
    }
  };

  return {
    ...authState,
    logout,
    updateAuthState,
  };
};
