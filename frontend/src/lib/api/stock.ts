// =============================================================================
// Felix Snack POS — Stock API Client
// Typed API client functions for stock management.
// All functions use the existing axios-based api helper from "@/lib/api".
// =============================================================================

import api, { apiPost } from "@/lib/api";
import type { ApiPaginatedResponse } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductStockResponse {
  id: string;
  name: string;
  sku: string | null;
  base_unit: string;
  stock: number;
  min_stock: number;
  status: "ok" | "low" | "out";
  category: { id: string; name: string };
}

export interface StockListMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface StockListResponse {
  success: boolean;
  data: ProductStockResponse[];
  meta: StockListMeta;
}

export interface StockMovementResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  type: string;
  qty: number;
  unit_name: string | null;
  unit_qty: number | null;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface StockMovementsResponse {
  success: boolean;
  data: StockMovementResponse[];
  meta: StockListMeta;
}

export interface StockInInput {
  product_id: string;
  qty: number;
  notes?: string | null;
}

export interface StockInResponse {
  success: boolean;
  data: {
    product: {
      id: string;
      name: string;
      stock: number;
      min_stock: number;
      base_unit: string;
      category: { id: string; name: string };
    };
    movement: {
      id: string;
      type: string;
      qty: number;
      stock_before: number;
      stock_after: number;
      created_at: string;
    };
  };
}

export interface StockQueryParams {
  search?: string;
  low_stock?: string;
  page?: number;
  per_page?: number;
}

export interface MovementsQueryParams {
  product_id?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Get paginated list of products with current stock levels.
 *
 * NOTE: Uses raw axios instead of apiGet because apiGet strips the outer
 * envelope and loses the `meta` field.
 */
export async function getStockList(
  params: StockQueryParams = {}
): Promise<StockListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.low_stock) searchParams.set("low_stock", params.low_stock);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();
  const url = `/stock${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ApiPaginatedResponse<ProductStockResponse>>(url);
  const body = response.data;

  return {
    success: true,
    data: body.data,
    meta: {
      current_page: body.meta?.current_page ?? 1,
      per_page: body.meta?.per_page ?? 20,
      total: body.meta?.total ?? 0,
      last_page: body.meta?.last_page ?? 1,
    },
  };
}

/**
 * Get paginated list of stock movements, newest first.
 */
export async function getStockMovements(
  params: MovementsQueryParams = {}
): Promise<StockMovementsResponse> {
  const searchParams = new URLSearchParams();

  if (params.product_id) searchParams.set("product_id", params.product_id);
  if (params.type) searchParams.set("type", params.type);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();
  const url = `/stock/movements${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ApiPaginatedResponse<StockMovementResponse>>(url);
  const body = response.data;

  return {
    success: true,
    data: body.data,
    meta: {
      current_page: body.meta?.current_page ?? 1,
      per_page: body.meta?.per_page ?? 20,
      total: body.meta?.total ?? 0,
      last_page: body.meta?.last_page ?? 1,
    },
  };
}

/**
 * Stock-in: add stock to a product.
 * Uses apiPost which strips the outer envelope and returns response.data.data.
 */
export async function stockIn(
  input: StockInInput
): Promise<StockInResponse["data"]> {
  return apiPost<StockInResponse["data"]>("/api/stock", input);
}
