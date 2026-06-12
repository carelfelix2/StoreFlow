// =============================================================================
// Felix Snack POS — Staff Header Component
// Mobile-first top header for staff pages.
// Shows store name, current user name/role, and logout button.
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { toast } from "sonner";

export function StaffHeader() {
  const router = useRouter();
  const { user } = useAuthStore();

  async function handleLogout() {
    try {
      await signOut({ redirect: false });
      useAuthStore.getState().logout();
      toast.success("Berhasil keluar");
      router.push("/login");
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
      {/* Left: Store name */}
      <div className="flex items-center gap-2 min-w-0">
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold truncate">
          Felix Snack
        </span>
      </div>

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground hidden xs:inline">
          {user?.name ?? "User"}
          {user?.role && (
            <span className="ml-1 text-[10px]">
              &middot; {USER_ROLE_LABELS[user.role] ?? user.role}
            </span>
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
