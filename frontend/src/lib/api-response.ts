// =============================================================================
// Felix Snack POS — API Response Helpers
// Consistent JSON response envelope for all Route Handlers.
// =============================================================================

import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth-helpers";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiPaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  meta: ApiPaginatedMeta;
}

// ---------------------------------------------------------------------------
// Success Responses
// ---------------------------------------------------------------------------

export function apiSuccess<T>(
  data: T,
  message: string = "Success",
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

export function apiCreated<T>(
  data: T,
  message: string = "Created successfully"
): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, message, 201);
}

export function apiDeleted(
  message: string = "Deleted successfully"
): NextResponse<ApiSuccessResponse<null>> {
  return apiSuccess(null, message, 200);
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number = 1,
  perPage: number = 20,
  message: string = "Success"
): NextResponse<ApiPaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage),
    },
  });
}

// ---------------------------------------------------------------------------
// Error Responses
// ---------------------------------------------------------------------------

export function apiError(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, message, ...(errors ? { errors } : {}) },
    { status }
  );
}

export function apiValidationError(
  zodError: ZodError
): NextResponse<ApiErrorResponse> {
  const errors: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }
  return apiError("Validation failed", 400, errors);
}

// ---------------------------------------------------------------------------
// Error Handler — wraps route handler logic to catch known errors
// ---------------------------------------------------------------------------

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AuthError) {
    return apiError(error.message, error.status);
  }

  if (error instanceof ZodError) {
    return apiValidationError(error);
  }

  // Prisma known request errors (unique constraint, foreign key, etc.)
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    switch (prismaError.code) {
      case "P2002":
        return apiError(
          `Duplicate value for: ${prismaError.meta?.target?.join(", ") || "field"}`,
          409
        );
      case "P2025":
        return apiError("Resource not found", 404);
      case "P2003":
        return apiError("Referenced resource does not exist", 400);
      case "P2014":
        return apiError("Cannot delete: resource is still in use", 409);
    }
  }

  // Fallback for unexpected errors
  console.error("[API Error]", error);
  return apiError("Internal server error", 500);
}
