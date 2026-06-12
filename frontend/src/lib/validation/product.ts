// =============================================================================
// Felix Snack POS — Product Validation Schemas
// Zod schemas for product CRUD operations with multi-unit support.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Product Unit Schema
// ---------------------------------------------------------------------------

/**
 * Schema for a single product unit.
 * - unit_name: required, 1-50 chars
 * - conversion_to_base: must be > 0, up to 2 decimal places
 * - selling_price: must be >= 0
 * - is_default: optional boolean
 */
export const productUnitSchema = z.object({
  unit_name: z
    .string()
    .min(1, "Unit name is required")
    .max(50, "Unit name must be 50 characters or less"),
  conversion_to_base: z
    .number()
    .positive("Conversion to base unit must be greater than 0")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().positive("Conversion to base unit must be greater than 0")),
  selling_price: z
    .number()
    .min(0, "Selling price must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Selling price must be 0 or greater")),
  is_default: z.boolean().optional().default(false),
});

export type ProductUnitInput = z.infer<typeof productUnitSchema>;

// ---------------------------------------------------------------------------
// Create Product Schema
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new product.
 * - category_id: required, must be a valid UUID
 * - name: required, 1-200 chars
 * - sku: optional, unique if provided
 * - barcode: optional
 * - image: optional URL
 * - base_unit: required, defaults to "pcs"
 * - cost_price: must be >= 0
 * - selling_price: must be >= 0
 * - stock: must be >= 0, defaults to 0
 * - min_stock: must be >= 0, defaults to 0
 * - units: array of at least one ProductUnitInput
 */
export const createProductSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or less"),
  sku: z
    .string()
    .max(50, "SKU must be 50 characters or less")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  barcode: z
    .string()
    .max(100, "Barcode must be 100 characters or less")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  image: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  base_unit: z
    .string()
    .min(1, "Base unit is required")
    .max(20, "Base unit must be 20 characters or less")
    .default("pcs"),
  cost_price: z
    .number()
    .min(0, "Cost price must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Cost price must be 0 or greater")),
  selling_price: z
    .number()
    .min(0, "Selling price must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Selling price must be 0 or greater")),
  stock: z
    .number()
    .min(0, "Stock must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Stock must be 0 or greater"))
    .optional()
    .default(0),
  min_stock: z
    .number()
    .min(0, "Minimum stock must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Minimum stock must be 0 or greater"))
    .optional()
    .default(0),
  units: z
    .array(productUnitSchema)
    .min(1, "Product must have at least one unit"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ---------------------------------------------------------------------------
// Update Product Schema
// ---------------------------------------------------------------------------

/**
 * Schema for updating an existing product.
 * All fields are optional — only provided fields will be updated.
 * Units can be fully replaced if provided.
 */
export const updateProductSchema = z.object({
  category_id: z.string().uuid("Invalid category ID").optional(),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or less")
    .optional(),
  sku: z
    .string()
    .max(50, "SKU must be 50 characters or less")
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  barcode: z
    .string()
    .max(100, "Barcode must be 100 characters or less")
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  image: z
    .string()
    .url("Image must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val === undefined ? undefined : val)),
  base_unit: z
    .string()
    .min(1, "Base unit is required")
    .max(20, "Base unit must be 20 characters or less")
    .optional(),
  cost_price: z
    .number()
    .min(0, "Cost price must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Cost price must be 0 or greater"))
    .optional(),
  selling_price: z
    .number()
    .min(0, "Selling price must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Selling price must be 0 or greater"))
    .optional(),
  stock: z
    .number()
    .min(0, "Stock must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Stock must be 0 or greater"))
    .optional(),
  min_stock: z
    .number()
    .min(0, "Minimum stock must be 0 or greater")
    .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number))
    .pipe(z.number().min(0, "Minimum stock must be 0 or greater"))
    .optional(),
  is_active: z.boolean().optional(),
  units: z
    .array(productUnitSchema)
    .min(1, "Product must have at least one unit")
    .optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ---------------------------------------------------------------------------
// Product Query Schema
// ---------------------------------------------------------------------------

/**
 * Schema for query parameters when listing products.
 * Supports search, category_id, is_active, low_stock, page, per_page.
 */
export const productQuerySchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid("Invalid category ID").optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  low_stock: z
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

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
