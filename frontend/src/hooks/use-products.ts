// =============================================================================
// Felix Snack POS — Products TanStack Query Hooks
// All product data fetching and mutation hooks.
// =============================================================================

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as productsApi from "@/lib/api/products";
import type {
  ProductQueryParams,
  CreateProductInput,
  UpdateProductInput,
} from "@/lib/api/products";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductQueryParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: ["categories"] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Hook to fetch paginated product list with filters.
 */
export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getProducts(params),
  });
}

/**
 * Hook to fetch a single product by ID.
 */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => productsApi.getProductById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch all active categories (for filter dropdown).
 */
export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: () => productsApi.getCategories(),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Hook to create a new product.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.createProduct(data),
    onSuccess: (product) => {
      toast.success(`Product "${product.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

/**
 * Hook to update an existing product.
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (product) => {
      toast.success(`Product "${product.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

/**
 * Hook to soft-delete a product.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}

/**
 * Hook to toggle product active status.
 */
export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.toggleProductActive(id),
    onSuccess: (product) => {
      const status = product.is_active ? "activated" : "deactivated";
      toast.success(`Product "${product.name}" ${status} successfully`);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to toggle product status");
    },
  });
}

// ---------------------------------------------------------------------------
// Export / Import Mutations
// ---------------------------------------------------------------------------

/**
 * Hook to export all products as CSV.
 */
export function useExportProducts() {
  return useMutation({
    mutationFn: () => productsApi.exportProducts(),
    onSuccess: () => {
      toast.success("Products exported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export products");
    },
  });
}

/**
 * Hook to import products from a CSV file.
 */
export function useImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => productsApi.importProducts(file),
    onSuccess: (result) => {
      const parts: string[] = [];
      if (result.created > 0) parts.push(`${result.created} created`);
      if (result.updated > 0) parts.push(`${result.updated} updated`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);

      const message = parts.length > 0
        ? `Import completed: ${parts.join(", ")}`
        : "Import completed — no changes made";

      toast.success(message);

      if (result.errors.length > 0) {
        // Show first few errors in console for debugging
        console.warn("[Import Errors]", result.errors.slice(0, 5));
      }

      // Invalidate both products and categories (import can create categories)
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import products");
    },
  });
}
