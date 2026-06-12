// =============================================================================
// Felix Snack POS — Category Validation Schemas
// Zod schemas for category CRUD operations.
// =============================================================================

import { z } from "zod";

/**
 * Schema for creating a new category.
 * - name: required, 1-100 chars
 * - slug: auto-generated from name if not provided, lowercase alphanumeric + hyphens
 * - color: optional hex color
 * - icon: optional icon name (Lucide icon names)
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color (e.g., #f97316)")
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name must be 50 characters or less")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Schema for updating an existing category.
 * All fields are optional — only provided fields will be updated.
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or less")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color (e.g., #f97316)")
    .nullable()
    .optional(),
  icon: z
    .string()
    .max(50, "Icon name must be 50 characters or less")
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Schema for query parameters when listing categories.
 */
export const categoryQuerySchema = z.object({
  search: z.string().optional(),
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

export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
