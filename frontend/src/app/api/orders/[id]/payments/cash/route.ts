// =============================================================================
// Felix Snack POS — Cash Payment API Route Handler
// POST /api/orders/[id]/payments/cash — Process cash payment for approved order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";
import { cashPaymentSchema } from "@/lib/validation/order-status";

/**
 * POST /api/orders/[id]/payments/cash
 * Process a cash payment for an approved order.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Payload:
 *   { paid_amount: number }
 *
 * Business rules:
 *   - Only approved orders can be paid
 *   - paid_amount must be >= grand_total
 *   - change_amount = paid_amount - grand_total
 *   - Creates Payment record (cash, paid)
 *   - Updates order status to paid
 *   - Reduces product stock
 *   - Creates StockMovement records
 *   - Creates OrderLog with PAYMENT_PAID action
 *   - No duplicate payments allowed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parsed = cashPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return handleApiError(
        new Error(parsed.error.issues[0]?.message ?? "Invalid input")
      );
    }

    const order = await orderService.processCashPayment(
      id,
      user.id,
      parsed.data
    );

    return apiSuccess(
      order,
      `Pembayaran untuk ${order.order_number} berhasil`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
