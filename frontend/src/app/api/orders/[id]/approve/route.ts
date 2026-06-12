// =============================================================================
// Felix Snack POS — Order Approve API Route Handler
// PATCH /api/orders/[id]/approve — Transition order from reviewing to approved
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * PATCH /api/orders/[id]/approve
 * Approve an order — transition from reviewing to approved.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Only reviewing orders can be approved
 *   - Creates OrderLog with STATUS_CHANGED -> approved
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const order = await orderService.approveOrder(id, user.id);

    return apiSuccess(
      order,
      `Order ${order.order_number} has been approved`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
