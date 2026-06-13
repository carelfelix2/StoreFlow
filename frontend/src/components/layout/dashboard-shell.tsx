"use client";

import { useUIStore } from "@/store/ui-store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

/**
 * Client-side dashboard shell that reacts to sidebar collapse state.
 * Wraps the server-rendered layout so we can use zustand state
 * to dynamically adjust the main content padding.
 * On mobile (< lg), sidebar overlays content instead of pushing it.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all min-w-0 max-w-full",
          sidebarOpen ? "lg:pl-64" : "lg:pl-0"
        )}
      >
        <AppHeader />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
