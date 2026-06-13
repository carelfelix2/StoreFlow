// =============================================================================
// Felix Snack POS — Admin Hooks (Backup, Audit, Health Check)
// TanStack Query hooks for admin-only operations (owner role).
// =============================================================================

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthCheckIssue {
  type: string;
  severity: "warning" | "error";
  message: string;
  reference_id: string | null;
  details: Record<string, unknown> | null;
}

export interface HealthCheckCheck {
  label: string;
  status: "passed" | "warning" | "error";
  count: number;
}

export interface HealthCheckResult {
  status: "healthy" | "warning" | "error";
  summary: string;
  timestamp: string;
  checks: HealthCheckCheck[];
  issues: HealthCheckIssue[];
}

export interface AuditOrderLog {
  id: string;
  order_id: string;
  order_number: string;
  order_status: string;
  user_name: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditPaymentLog {
  id: string;
  payment_id: string;
  order_number: string;
  method: string;
  amount: number;
  payment_status: string;
  user_name: string;
  event: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditStockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: string;
  qty: number;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  created_by: string;
  order_number: string | null;
  created_at: string;
}

export interface AuditData {
  order_logs?: AuditOrderLog[];
  payment_logs?: AuditPaymentLog[];
  stock_movements?: AuditStockMovement[];
}

// ---------------------------------------------------------------------------
// Export Functions
// ---------------------------------------------------------------------------

async function triggerExport(url: string, filename: string): Promise<void> {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Export failed" }));
    throw new Error(error.message || "Export failed");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const adminKeys = {
  all: ["admin"] as const,
  healthCheck: () => [...adminKeys.all, "health-check"] as const,
  audit: (type?: string) => [...adminKeys.all, "audit", type] as const,
};

// ---------------------------------------------------------------------------
// Export Mutations
// ---------------------------------------------------------------------------

export function useAdminExportProducts() {
  return useMutation({
    mutationFn: () => triggerExport("/api/admin/export/products", "products"),
    onSuccess: () => toast.success("Products exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export products"),
  });
}

export function useAdminExportCategories() {
  return useMutation({
    mutationFn: () =>
      triggerExport("/api/admin/export/categories", "categories"),
    onSuccess: () => toast.success("Categories exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export categories"),
  });
}

export function useAdminExportUsers() {
  return useMutation({
    mutationFn: () => triggerExport("/api/admin/export/users", "users"),
    onSuccess: () => toast.success("Users exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export users"),
  });
}

export function useAdminExportOrders() {
  return useMutation({
    mutationFn: () => triggerExport("/api/admin/export/orders", "orders"),
    onSuccess: () => toast.success("Orders exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export orders"),
  });
}

export function useAdminExportOrderItems() {
  return useMutation({
    mutationFn: () =>
      triggerExport("/api/admin/export/order-items", "order-items"),
    onSuccess: () => toast.success("Order items exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export order items"),
  });
}

export function useAdminExportPayments() {
  return useMutation({
    mutationFn: () => triggerExport("/api/admin/export/payments", "payments"),
    onSuccess: () => toast.success("Payments exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export payments"),
  });
}

export function useAdminExportStockMovements() {
  return useMutation({
    mutationFn: () =>
      triggerExport("/api/admin/export/stock-movements", "stock-movements"),
    onSuccess: () => toast.success("Stock movements exported successfully"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to export stock movements"),
  });
}

// ---------------------------------------------------------------------------
// Health Check Query
// ---------------------------------------------------------------------------

export function useHealthCheck() {
  return useQuery<HealthCheckResult>({
    queryKey: adminKeys.healthCheck(),
    queryFn: async () => {
      const response = await fetch("/api/admin/health-check", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Health check failed" }));
        throw new Error(error.message || "Health check failed");
      }

      const body = await response.json();
      return body.data as HealthCheckResult;
    },
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Audit Query
// ---------------------------------------------------------------------------

export function useAudit(type: string = "all", limit: number = 50) {
  return useQuery<AuditData>({
    queryKey: adminKeys.audit(type),
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/audit?type=${type}&limit=${limit}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Audit fetch failed" }));
        throw new Error(error.message || "Audit fetch failed");
      }

      const body = await response.json();
      return body.data as AuditData;
    },
    refetchOnWindowFocus: false,
  });
}
