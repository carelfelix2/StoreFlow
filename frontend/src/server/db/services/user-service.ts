// =============================================================================
// Felix Snack POS — User Service
// Business logic layer for user management operations.
// Owner-only: create, update, reset password, toggle active.
// =============================================================================

import bcrypt from "bcryptjs";
import * as userRepository from "@/server/db/repositories/user-repository";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
  ResetPasswordInput,
} from "@/lib/validation/user";
import { AuthError } from "@/lib/auth-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toResponse(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * List users with optional filtering and pagination.
 * Owner only — already enforced at the route handler level.
 */
export async function listUsers(query: UserQueryInput) {
  const filters: userRepository.UserFilters = {
    search: query.search,
    role: query.role,
    is_active: query.is_active,
    page: query.page,
    per_page: query.per_page,
  };

  const { data, total } = await userRepository.findMany(filters);

  return {
    data: data.map(toResponse),
    total,
    page: query.page,
    per_page: query.per_page,
  };
}

/**
 * Get a single user by ID.
 */
export async function getUserById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) return null;
  return toResponse(user);
}

/**
 * Create a new user.
 * Business rules:
 * - Email must be unique
 * - Password is hashed with bcrypt
 */
export async function createUser(input: CreateUserInput) {
  // Check email uniqueness
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new AuthError(`Email "${input.email}" sudah digunakan`, 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: input.role,
  });

  return toResponse(user);
}

/**
 * Update an existing user.
 * Business rules:
 * - Email must be unique (if changed)
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
  currentUserId: string
) {
  // Verify user exists
  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new AuthError("User tidak ditemukan", 404);
  }

  // If email is being changed, check uniqueness
  if (input.email && input.email !== existing.email) {
    const emailExists = await userRepository.findByEmail(input.email);
    if (emailExists) {
      throw new AuthError(`Email "${input.email}" sudah digunakan`, 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.role !== undefined) updateData.role = input.role;

  const user = await userRepository.update(id, updateData);
  return toResponse(user);
}

/**
 * Reset a user's password.
 * Business rules:
 * - Owner cannot reset their own password via this admin action
 */
export async function resetUserPassword(
  id: string,
  input: ResetPasswordInput,
  currentUserId: string
) {
  // Prevent owner from resetting their own password via admin
  if (id === currentUserId) {
    throw new AuthError(
      "Tidak dapat mereset password sendiri dari menu admin. Gunakan halaman profil.",
      400
    );
  }

  // Verify user exists
  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new AuthError("User tidak ditemukan", 404);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(input.password, 12);

  await userRepository.update(id, { password: hashedPassword });

  return toResponse({ ...existing, password: "" } as typeof existing);
}

/**
 * Toggle user active/inactive status.
 * Business rules:
 * - Owner cannot deactivate their own account
 * - Inactive users cannot login (enforced in auth.ts authorize callback)
 */
export async function toggleUserActive(
  id: string,
  currentUserId: string
) {
  // Verify user exists
  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new AuthError("User tidak ditemukan", 404);
  }

  // Prevent owner from deactivating themselves
  if (id === currentUserId) {
    throw new AuthError(
      "Tidak dapat menonaktifkan akun sendiri",
      400
    );
  }

  const newStatus = !existing.is_active;
  const user = await userRepository.toggleActive(id, newStatus);

  return toResponse(user);
}
