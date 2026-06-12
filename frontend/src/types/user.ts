// =============================================================================
// Felix Snack POS — User Types
// UserRole must match Prisma schema enum values (owner, cashier, staff).
// =============================================================================

export type UserRole = "owner" | "cashier" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  email_verified?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}
