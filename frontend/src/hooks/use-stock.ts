// =============================================================================
// Felix Snack POS — Stock Management TanStack Query Hooks
// All stock data fetching and mutation hooks.
// =============================================================================

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as stockApi from "@/lib/api/stock";
import type {
  StockQueryParams,
  MovementsQueryParams,
  StockInInput,
} from "@/lib/api/stock";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const stockKeys = {
  all: ["stock"] as const,
  list: (params: StockQueryParams = {}) =>
    [...stockKeys.all, "list", params] as const,
  movements: (params: MovementsQueryParams = {}) =>
    [...stockKeys.all, "movements", params] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Hook to fetch paginated product stock list with filters.
 */
export function useStockList(params: StockQueryParams = {}) {
  return useQuery({
    queryKey: stockKeys.list(params),
    queryFn: () => stockApi.getStockList(params),
  });
}

/**
 * Hook to fetch paginated stock movements with filters.
 */
export function useStockMovements(params: MovementsQueryParams = {}) {
  return useQuery({
    queryKey: stockKeys.movements(params),
    queryFn: () => stockApi.getStockMovements(params),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Hook to perform a stock-in operation.
 */
export function useStockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StockInInput) => stockApi.stockIn(data),
    onSuccess: (result) => {
      toast.success(`Stok "${result.product.name}" berhasil ditambah`);
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Gagal menambah stok");
    },
  });
}
