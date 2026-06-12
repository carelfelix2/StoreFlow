// =============================================================================
// Felix Snack POS — Products API Client
// Typed API client functions for product CRUD operations.
// All functions use the existing axios-based api helper from "@/lib/api".
// =============================================================================

import api, { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import type { ApiPaginatedResponse } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductUnitResponse {
  id: string;
  unit_name: string;
  conversion_to_base: number;
  selling_price: number;
  is_default: boolean;
}

export interface ProductResponse {
  id: string;
  category_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  };
  units: ProductUnitResponse[];
}

export interface ProductListMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductListResponse {
  success: boolean;
  data: ProductResponse[];
  meta: ProductListMeta;
}

export interface ProductQueryParams {
  search?: string;
  category_id?: string;
  is_active?: string;
  low_stock?: string;
  page?: number;
  per_page?: number;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  image?: string;
  base_unit?: string;
  cost_price: number;
  selling_price: number;
  stock?: number;
  min_stock?: number;
  units: Array<{
    unit_name: string;
    conversion_to_base: number;
    selling_price: number;
    is_default?: boolean;
  }>;
}

export interface UpdateProductInput {
  category_id?: string;
  name?: string;
  sku?: string | null;
  barcode?: string | null;
  image?: string | null;
  base_unit?: string;
  cost_price?: number;
  selling_price?: number;
  stock?: number;
  min_stock?: number;
  is_active?: boolean;
  units?: Array<{
    unit_name: string;
    conversion_to_base: number;
    selling_price: number;
    is_default?: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Category Types (for the category filter dropdown)
// ---------------------------------------------------------------------------

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Get paginated list of products with optional filters.
 *
 * NOTE: Uses raw axios instead of apiGet because apiGet strips the outer
 * envelope and loses the `meta` field. The GET /api/products route returns
 * { success, message, data: ProductResponse[], meta: {...} }.
 */
export async function getProducts(
  params: ProductQueryParams = {}
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.category_id) searchParams.set("category_id", params.category_id);
  if (params.is_active) searchParams.set("is_active", params.is_active);
  if (params.low_stock) searchParams.set("low_stock", params.low_stock);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();
  const url = `/products${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ApiPaginatedResponse<ProductResponse>>(url);
  const body = response.data;

  return {
    success: true,
    data: body.data,
    meta: {
      total: body.meta?.total ?? 0,
      page: body.meta?.current_page ?? 1,
      per_page: body.meta?.per_page ?? 20,
      total_pages: body.meta?.last_page ?? 1,
    },
  };
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id: string): Promise<ProductResponse> {
  return apiGet<ProductResponse>(`/products/${id}`);
}

/**
 * Create a new product.
 */
export async function createProduct(
  data: CreateProductInput
): Promise<ProductResponse> {
  return apiPost<ProductResponse>("/products", data);
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ProductResponse> {
  return apiPut<ProductResponse>(`/products/${id}`, data);
}

/**
 * Soft delete a product.
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiDelete<void>(`/products/${id}`);
}

/**
 * Toggle product active status.
 */
export async function toggleProductActive(
  id: string
): Promise<ProductResponse> {
  return apiPatch<ProductResponse>(`/products/${id}/toggle`);
}

/**
 * Get all active categories (for filter dropdown).
 */
export async function getCategories(): Promise<CategoryResponse[]> {
  return apiGet<CategoryResponse[]>("/categories?is_active=true&per_page=100");
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

/**
 * Export all products as CSV. Triggers a browser file download.
 */
export async function exportProducts(): Promise<void> {
  const response = await fetch("/api/products/export", {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Export failed" }));
    throw new Error(error.message || "Export failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Import products from a CSV file.
 * Returns a summary of created, updated, skipped, and failed rows.
 */
export async function importProducts(
  file: File
): Promise<{
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/products/import", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Import failed");
  }

  return result.data;
}
