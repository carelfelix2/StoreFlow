// =============================================================================
// Felix Snack POS — User Validation Schemas
// Zod schemas for user management operations (owner only).
// =============================================================================

import { z } from "zod";

export const userRoles = ["owner", "cashier", "staff"] as const;

/**
 * Schema for creating a new user.
 * - name: required, 1-100 chars
 * - email: required, valid email format
 * - password: required, min 6 chars
 * - role: required, must be owner/cashier/staff
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  role: z.enum(userRoles, {
    message: "Role harus owner, cashier, atau staff",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema for updating an existing user.
 * All fields are optional — only provided fields will be updated.
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .optional(),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .optional(),
  role: z
    .enum(userRoles, {
      message: "Role harus owner, cashier, atau staff",
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Schema for resetting a user's password.
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for query parameters when listing users.
 */
export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (userRoles.includes(val as (typeof userRoles)[number])) return val;
      return undefined;
    }),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  per_page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
