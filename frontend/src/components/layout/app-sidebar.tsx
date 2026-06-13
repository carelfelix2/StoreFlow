"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { APP_NAME } from "@/lib/constants";
import type { UserRole } from "@/types/user";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const allNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["owner"],
  },
  {
    href: "/cashier",
    label: "Kasir",
    icon: ShoppingCart,
    roles: ["owner", "cashier"],
  },
  {
    href: "/products",
    label: "Produk",
    icon: Package,
    roles: ["owner", "cashier"],
  },
  {
    href: "/stock",
    label: "Stok",
    icon: ClipboardList,
    roles: ["owner"],
  },
  {
    href: "/reports",
    label: "Laporan",
    icon: BarChart3,
    roles: ["owner", "cashier"],
  },
  {
    href: "/settings",
    label: "Pengaturan",
    icon: Settings,
    roles: ["owner", "cashier"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);

  const visibleItems = allNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  // Mobile overlay toggle button (visible when sidebar is closed)
  if (!sidebarOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-2 top-2 z-50"
        onClick={toggleSidebar}
      >
        <ChevronLeft className="h-4 w-4 rotate-180" />
      </Button>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop - visible below lg breakpoint */}
      <div
        className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar shadow-xl lg:shadow-none">
        <div className="flex h-14 items-center gap-2 px-4 font-semibold">
          <ShoppingCart className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm truncate">{APP_NAME}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 shrink-0"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "font-medium"
                    )}
                    size="sm"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="p-3 text-xs text-muted-foreground">
          v0.1.0 &mdash; StoreFlow POS
        </div>
      </aside>
    </>
  );
}
