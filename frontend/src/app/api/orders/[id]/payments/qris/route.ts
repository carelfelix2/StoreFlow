// =============================================================================
// Felix Snack POS — QRIS Payment Initiation API Route Handler
// POST /api/orders/[id]/payments/qris — Initiate QRIS payment for approved order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * POST /api/orders/[id]/payments/qris
 * Initiate a QRIS payment for an approved order.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Order must be in "approved" status
 *   - No duplicate paid payment allowed
 *   - Creates Payment record with status "pending"
 *   - Order status becomes "waiting_payment"
 *   - Creates OrderLog PAYMENT_STARTED
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const payment = await orderService.initiateQrisPayment(id, user.id);

    return apiSuccess(
      payment,
      "QRIS payment initiated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
