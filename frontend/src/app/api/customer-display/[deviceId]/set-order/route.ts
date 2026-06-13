// =============================================================================
// Felix Snack POS — Customer Display Set Order API Route Handler
// POST /api/customer-display/[deviceId]/set-order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { setDisplayState } from "@/server/customer-display/display-state";
import * as orderRepository from "@/server/db/repositories/order-repository";

/**
 * POST /api/customer-display/[deviceId]/set-order
 *
 * Set the active order for a customer display device.
 * Bodies:
 *   { order_id: string }
 *
 * Access:
 *   - Cashier, Owner
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    await requireRole(["owner", "cashier"]);
    const { deviceId } = await params;

    const body = await request.json();
    const { order_id } = body;

    if (!order_id || typeof order_id !== "string") {
      return apiSuccess(null, "order_id is required");
    }

    // Verify order exists
    const order = await orderRepository.findById(order_id);
    if (!order) {
      return apiSuccess(null, "Order not found");
    }

    // Derive display state from order status
    let displayState: "viewing_order" | "waiting_payment" | "paid" | "printed" =
      "viewing_order";

    if (order.status === "waiting_payment") {
      displayState = "waiting_payment";
    } else if (order.status === "paid") {
      displayState = "paid";
    } else if (order.status === "printed") {
      displayState = "printed";
    }

    const state = setDisplayState(deviceId, displayState, order_id);

    return apiSuccess({
      device_id: deviceId,
      state: state.state,
      order_id: state.order_id,
      updated_at: state.updated_at,
    }, `Display set to ${order.order_number}`);
  } catch (error) {
    return handleApiError(error);
  }
}
