// =============================================================================
// Felix Snack POS — Dashboard Hook
// React Query hook for real-time owner dashboard data.
// =============================================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { DashboardData } from "@/types/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  owner: () => ["dashboard", "owner"] as const,
};

/**
 * Fetch full owner dashboard data from GET /api/dashboard/owner.
 * The API is owner-only (requireRole(["owner"])).
 */
export function useOwnerDashboard() {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.owner(),
    queryFn: () => apiGet<DashboardData>("/dashboard"),
    refetchInterval: 30_000, // auto-refresh every 30s
    staleTime: 10_000,
  });
}
