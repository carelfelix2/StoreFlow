"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User } from "lucide-react";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { toast } from "sonner";

export function AppHeader() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="flex items-center gap-2" type="button">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm md:block">
                <div className="font-medium">{user?.name ?? "User"}</div>
                <div className="text-xs text-muted-foreground">
                  {user ? USER_ROLE_LABELS[user.role] ?? user.role : ""}
                </div>
              </div>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
