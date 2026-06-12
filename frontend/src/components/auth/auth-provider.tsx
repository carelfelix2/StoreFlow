"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/user";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider wraps the app with Auth.js SessionProvider.
 * It syncs the Auth.js session into the Zustand auth store for UI state.
 *
 * Auth.js is the source of truth for authentication.
 * Zustand stores derived UI-friendly state (user profile, role checks).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  );
}

/**
 * Internal component that syncs Auth.js session → Zustand store.
 */
function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, setHydrated } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (status === "loading") return;

    initialized.current = true;

    if (session?.user) {
      const authUser = session.user;
      const user: User = {
        id: authUser.id as string,
        name: authUser.name as string,
        email: authUser.email as string,
        role: authUser.role as "owner" | "cashier" | "staff",
        is_active: (authUser as { is_active?: boolean }).is_active ?? true,
        created_at: "",
        updated_at: "",
      };
      setUser(user);
    } else {
      setUser(null);
    }

    setHydrated(true);
  }, [status, session, setUser, setHydrated]);

  // Show loading skeleton while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-primary/30" />
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-4 w-48" />
            <Skeleton className="mx-auto h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
