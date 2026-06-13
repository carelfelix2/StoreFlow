// =============================================================================
// Felix Snack POS — Order Void API Route Handler
// PATCH /api/orders/[id]/void — Void a paid/printed/completed order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * PATCH /api/orders/[id]/void
 * Void an order — transition from paid/printed/completed to voided.
 *
 * Access:
 *   - Owner only (voiding is a destructive action)
 *
 * Business rules:
 *   - Only paid, printed, or completed orders can be voided
 *   - Creates OrderLog with ORDER_VOIDED action
 *   - Does NOT reverse payments or restore stock (manual reconciliation required)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    const order = await orderService.voidOrder(id, user.id);

    return apiSuccess(
      order,
      `Order ${order.order_number} has been voided`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
