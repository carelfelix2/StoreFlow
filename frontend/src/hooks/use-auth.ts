"use client";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/user";

/**
 * Primary auth hook — access full auth state and actions.
 * Auth.js session is the source of truth.
 * Zustand store provides derived UI state.
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const { user, isAuth, isHydrated, logout } = useAuthStore();

  return {
    user,
    session,
    isAuth,
    isHydrated,
    isLoading: status === "loading" || !isHydrated,
    logout,
  };
}

/**
 * Hook to get current user only.
 */
export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

/**
 * Check if current user has a specific role.
 * Accepts a single role or array of roles.
 */
export function useHasRole(role: UserRole | UserRole[]) {
  return useAuthStore((s) => s.hasRole(role));
}
