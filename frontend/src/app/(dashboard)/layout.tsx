import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard - Felix Snack POS",
};

/**
 * Dashboard route group layout.
 * All pages under (dashboard) share this shell with sidebar + header.
 * Proxy already handles role-based routing at the edge,
 * so unauthorized users can't reach this layout.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
