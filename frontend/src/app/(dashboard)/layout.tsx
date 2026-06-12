import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = {
  title: "Dashboard - Felix Snack POS",
};

/**
 * Dashboard route group layout.
 * All pages under (dashboard) share this shell with sidebar + header.
 * Middleware already handles role-based routing at the edge,
 * so unauthorized users can't reach this layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
