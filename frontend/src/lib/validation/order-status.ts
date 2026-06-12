// =============================================================================
// Felix Snack POS — Order Status Validation Schemas
// Zod schemas for order status transition requests.
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Order Query Schema (for listing orders)
// ---------------------------------------------------------------------------

export const orderQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const n = parseInt(val ?? "1", 10);
      return isNaN(n) || n < 1 ? 1 : n;
    }),
  per_page: z
    .string()
    .optional()
    .transform((val) => {
      const n = parseInt(val ?? "20", 10);
      return isNaN(n) || n < 1 ? 20 : Math.min(n, 100);
    }),
});

export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

// ---------------------------------------------------------------------------
// Cash Payment Schema
// ---------------------------------------------------------------------------

/**
 * Schema for cash payment request body.
 * paid_amount must be a positive number.
 */
export const cashPaymentSchema = z.object({
  paid_amount: z
    .number()
    .positive("Jumlah uang diterima harus lebih dari 0"),
});

export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;
