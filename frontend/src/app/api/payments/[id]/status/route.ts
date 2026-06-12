// =============================================================================
// Felix Snack POS — Payment Status Check API Route Handler
// GET /api/payments/[id]/status — Check the current status of a QRIS payment
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getActivePaymentProvider } from "@/server/payments";
import * as orderRepository from "@/server/db/repositories/order-repository";

/**
 * GET /api/payments/[id]/status
 * Check the current status of a QRIS payment by its internal payment ID.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Flow:
 *   1. Fetch the payment record from the database
 *   2. Get the gateway reference
 *   3. Call the active payment provider to check status
 *   4. Return the status from the provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    // Fetch payment record from database
    const payment = await orderRepository.findPendingPaymentById(id);

    if (!payment) {
      return handleApiError(new Error("Payment not found"));
    }

    // Get the active payment provider and check status
    const provider = getActivePaymentProvider();
    const statusResponse = await provider.checkPaymentStatus({
      gateway_reference: payment.gateway_reference!,
    });

    return apiSuccess(
      {
        payment_id: payment.id,
        order_id: payment.order_id,
        gateway: statusResponse.gateway,
        gateway_reference: statusResponse.gateway_reference,
        status: statusResponse.status,
        paid_at: statusResponse.paid_at ?? null,
      },
      "Payment status retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
