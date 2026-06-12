// =============================================================================
// Felix Snack POS — Order Review API Route Handler
// PATCH /api/orders/[id]/review — Transition order from submitted to reviewing
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * PATCH /api/orders/[id]/review
 * Review an order — transition from submitted to reviewing.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Only submitted orders can be reviewed
 *   - Creates OrderLog with STATUS_CHANGED -> reviewing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const order = await orderService.reviewOrder(id, user.id);

    return apiSuccess(
      order,
      `Order ${order.order_number} is now being reviewed`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
