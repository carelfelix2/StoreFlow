// =============================================================================
// Felix Snack POS — Order Cancel API Route Handler
// PATCH /api/orders/[id]/cancel — Cancel a submitted or reviewing order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * PATCH /api/orders/[id]/cancel
 * Cancel an order — transition from submitted/reviewing to cancelled.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Only submitted or reviewing orders can be cancelled
 *   - Creates OrderLog with ORDER_CANCELLED action
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const order = await orderService.cancelOrder(id, user.id);

    return apiSuccess(
      order,
      `Order ${order.order_number} has been cancelled`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
