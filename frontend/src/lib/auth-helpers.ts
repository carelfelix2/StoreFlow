// =============================================================================
// Felix Snack POS — Server-side Auth Helpers
// Uses Auth.js v5 session (cookie-based) instead of Bearer tokens.
// getAuthUser() / requireAuth() / requireRole() are used by Route Handlers
// to validate sessions and enforce role permissions.
// =============================================================================

import { auth } from "@/auth";
import type { UserRole } from "@/types/user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

/**
 * Get the authenticated user from the Auth.js session.
 * Auth.js v5 uses cookie-based sessions (JWT strategy).
 * Returns null if no valid session exists.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user;
  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    role: user.role as string,
    is_active: (user as { is_active?: boolean }).is_active ?? true,
  };
}

/**
 * Get the authenticated user or throw a 401 response.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError("Unauthenticated", 401);
  }
  return user;
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws 403 if the user lacks permission.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new AuthError("Forbidden: insufficient permissions", 403);
  }
  return user;
}

/**
 * Custom error class for auth failures.
 * Caught by the API route error handler to return proper HTTP status codes.
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
