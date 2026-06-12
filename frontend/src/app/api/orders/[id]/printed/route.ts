// =============================================================================
// Felix Snack POS — Order Mark Printed API Route Handler
// PATCH /api/orders/[id]/printed — Mark order as printed after successful print
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * PATCH /api/orders/[id]/printed
 * Mark an order as printed after successful print.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Order must be in "paid" status
 *   - Creates OrderLog with PRINTED action
 *   - Reprint is allowed (idempotent)
 *   - Returns receipt data after marking
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const receipt = await orderService.markAsPrinted(id, user.id);

    return apiSuccess(
      receipt,
      `Order ${receipt.order_number} marked as printed`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
