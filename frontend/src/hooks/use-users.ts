// =============================================================================
// Felix Snack POS — User Management Hooks
// React Query hooks for user CRUD operations (owner only).
// =============================================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { apiPost, apiPut, apiPatch } from "@/lib/api";
import type { User } from "@/types/user";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserListQuery {
  search?: string;
  role?: string;
  is_active?: string;
  page?: number;
  per_page?: number;
}

export interface UserListResponse {
  data: User[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
}

export interface ResetPasswordPayload {
  password: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const userKeys = {
  all: ["users"] as const,
  list: (query: UserListQuery) => ["users", "list", query] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch paginated list of users with optional filters.
 *
 * NOTE: Uses raw axios instead of apiGet because apiGet strips the outer
 * envelope and loses the `meta` field. The GET /api/users route returns
 * { success, message, data: User[], meta: {...} }.
 */
export function useUsers(query: UserListQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.is_active !== undefined) params.set("is_active", query.is_active);
  if (query.page) params.set("page", String(query.page));
  if (query.per_page) params.set("per_page", String(query.per_page));

  const qs = params.toString();

  return useQuery<UserListResponse>({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: User[];
        meta?: { current_page: number; per_page: number; total: number; last_page: number };
      }>(`/users${qs ? `?${qs}` : ""}`);
      const body = response.data;
      return {
        data: body.data,
        meta: body.meta ? {
          current_page: body.meta.current_page,
          per_page: body.meta.per_page,
          total: body.meta.total,
          last_page: body.meta.last_page,
        } : undefined,
      };
    },
  });
}

/**
 * Create a new user (owner only).
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiPost<User>("/users", payload),
    onSuccess: (data) => {
      toast.success(`User "${data.name}" berhasil dibuat`);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat user");
    },
  });
}

/**
 * Update an existing user (owner only).
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserPayload & { id: string }) =>
      apiPut<User>(`/users/${id}`, payload),
    onSuccess: (data) => {
      toast.success(`User "${data.name}" berhasil diperbarui`);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui user");
    },
  });
}

/**
 * Reset a user's password (owner only).
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, ...payload }: ResetPasswordPayload & { id: string }) =>
      apiPatch<User>(`/users/${id}/reset-password`, payload),
    onSuccess: (data) => {
      toast.success(`Password "${data.name}" berhasil direset`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mereset password");
    },
  });
}

/**
 * Toggle user active/inactive status (owner only).
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<User>(`/users/${id}/toggle-active`),
    onSuccess: (data) => {
      const status = data.is_active ? "diaktifkan" : "dinonaktifkan";
      toast.success(`User "${data.name}" berhasil ${status}`);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengubah status user");
    },
  });
}
