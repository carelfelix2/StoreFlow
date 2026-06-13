// =============================================================================
// Felix Snack POS — Report Validation Schemas
// =============================================================================

import { z } from "zod";

const dateString = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    "Format tanggal harus YYYY-MM-DD"
  );

export const summaryReportQuerySchema = z.object({
  start_date: dateString,
  end_date: dateString,
});

export type SummaryReportQuery = z.infer<typeof summaryReportQuerySchema>;

export const salesReportQuerySchema = z.object({
  start_date: dateString,
  end_date: dateString,
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

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;

export const productReportQuerySchema = z.object({
  start_date: dateString,
  end_date: dateString,
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(50)),
});

export type ProductReportQuery = z.infer<typeof productReportQuerySchema>;

export const stockReportQuerySchema = z.object({
  search: z.string().optional(),
  low_stock_only: z
    .string()
    .optional()
    .transform((val) => val === "true"),
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

export type StockReportQuery = z.infer<typeof stockReportQuerySchema>;

export const paymentReportQuerySchema = z.object({
  start_date: dateString,
  end_date: dateString,
});

export type PaymentReportQuery = z.infer<typeof paymentReportQuerySchema>;
