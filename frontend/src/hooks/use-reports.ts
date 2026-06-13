// =============================================================================
// Felix Snack POS — Report Hooks
// React Query hooks for reports (summary, sales, products, stock, payments).
// =============================================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type {
  SummaryReport,
  SalesReport,
  ProductReport,
  StockReport,
  PaymentReport,
} from "@/types/report";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const reportKeys = {
  summary: (start?: string, end?: string) =>
    ["reports", "summary", start, end] as const,
  sales: (start?: string, end?: string, page?: number) =>
    ["reports", "sales", start, end, page] as const,
  products: (start?: string, end?: string, limit?: number) =>
    ["reports", "products", start, end, limit] as const,
  stock: (search?: string, low_stock_only?: boolean, page?: number) =>
    ["reports", "stock", search, low_stock_only, page] as const,
  payments: (start?: string, end?: string) =>
    ["reports", "payments", start, end] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return sp.toString();
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSummaryReport(startDate?: string, endDate?: string) {
  const qs = buildQs({ start_date: startDate, end_date: endDate });
  return useQuery<SummaryReport>({
    queryKey: reportKeys.summary(startDate, endDate),
    queryFn: () =>
      apiGet<SummaryReport>(`/reports/summary${qs ? `?${qs}` : ""}`),
  });
}

export function useSalesReport(
  startDate?: string,
  endDate?: string,
  page: number = 1
) {
  const qs = buildQs({
    start_date: startDate,
    end_date: endDate,
    page,
    per_page: 20,
  });
  return useQuery<SalesReport>({
    queryKey: reportKeys.sales(startDate, endDate, page),
    queryFn: () =>
      apiGet<SalesReport>(`/reports/sales${qs ? `?${qs}` : ""}`),
  });
}

export function useProductReport(
  startDate?: string,
  endDate?: string,
  limit: number = 10
) {
  const qs = buildQs({ start_date: startDate, end_date: endDate, limit });
  return useQuery<ProductReport>({
    queryKey: reportKeys.products(startDate, endDate, limit),
    queryFn: () =>
      apiGet<ProductReport>(`/reports/products?${qs}`),
  });
}

export function useStockReport(
  search?: string,
  lowStockOnly: boolean = false,
  page: number = 1
) {
  const qs = buildQs({
    search,
    low_stock_only: lowStockOnly ? "true" : undefined,
    page,
    per_page: 20,
  });
  return useQuery<StockReport>({
    queryKey: reportKeys.stock(search, lowStockOnly, page),
    queryFn: () =>
      apiGet<StockReport>(`/reports/stock?${qs}`),
  });
}

export function usePaymentReport(startDate?: string, endDate?: string) {
  const qs = buildQs({ start_date: startDate, end_date: endDate });
  return useQuery<PaymentReport>({
    queryKey: reportKeys.payments(startDate, endDate),
    queryFn: () =>
      apiGet<PaymentReport>(`/reports/payments${qs ? `?${qs}` : ""}`),
  });
}
