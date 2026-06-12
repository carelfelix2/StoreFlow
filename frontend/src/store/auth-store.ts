// =============================================================================
// Felix Snack POS — Auth Store (Zustand)
// Derives user state from Auth.js session via useSession() hook.
// Auth.js is the source of truth for authentication.
// Zustand stores UI-friendly derived state (user profile, role checks).
// =============================================================================

import { create } from "zustand";
import type { User, UserRole } from "@/types/user";

interface AuthStore {
  user: User | null;
  isAuth: boolean;
  isHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;

  // Computed helpers
  hasRole: (role: UserRole | UserRole[]) => boolean;
  getDefaultRoute: () => string;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isAuth: false,
  isHydrated: false,

  setUser: (user: User | null) => {
    set({ user, isAuth: !!user });
  },

  setHydrated: (hydrated: boolean) => {
    set({ isHydrated: hydrated });
  },

  logout: () => {
    set({ user: null, isAuth: false });
  },

  hasRole: (role: UserRole | UserRole[]) => {
    const { user } = get();
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  },

  getDefaultRoute: () => {
    const { user } = get();
    if (!user) return "/login";

    switch (user.role) {
      case "owner":
        return "/dashboard";
      case "cashier":
        return "/cashier";
      case "staff":
        return "/staff/order";
      default:
        return "/login";
    }
  },
}));
