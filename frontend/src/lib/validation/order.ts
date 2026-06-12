// =============================================================================
// Felix Snack POS — Order Validation Schemas
// Zod schemas for order creation and order item validation.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Order Item Schema
// ---------------------------------------------------------------------------

/**
 * Schema for a single order item from the staff cart.
 * - product_id: UUID from the database
 * - unit_name: the selected unit (e.g., "pcs", "renteng", "dus")
 * - qty: positive number, how many of the selected unit
 */
export const createOrderItemSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID"),
  unit_name: z.string().min(1, "Unit name is required"),
  qty: z
    .number()
    .positive("Quantity must be greater than 0")
    .finite("Quantity must be a finite number"),
});

/**
 * Inferred type for a single order item input.
 */
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

// ---------------------------------------------------------------------------
// Create Order Schema
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new order from the staff cart.
 * - customer_name: optional buyer name
 * - notes: optional order notes
 * - items: array of at least 1 item
 */
export const createOrderSchema = z.object({
  customer_name: z
    .string()
    .max(200, "Customer name must be at most 200 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  items: z
    .array(createOrderItemSchema)
    .min(1, "Order must have at least 1 item"),
});

/**
 * Inferred type for the create order input.
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
