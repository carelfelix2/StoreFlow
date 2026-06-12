// =============================================================================
// Felix Snack POS — Mock Payment Confirmation API Route Handler
// POST /api/payments/[id]/mock-paid — Simulate a QRIS payment as paid (dev only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * POST /api/payments/[id]/mock-paid
 * Simulate a mock QRIS payment as paid (development/testing only).
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Payment must be in "pending" status
 *   - Payment must not be expired
 *   - In transaction: payment → paid, order → paid, reduce stock,
 *     create stock movements, create PaymentLog, create OrderLog
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const order = await orderService.confirmMockPayment(id, user.id);

    return apiSuccess(
      order,
      "Payment confirmed successfully (mock)"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
