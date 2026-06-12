// =============================================================================
// Felix Snack POS — Order Detail API Route Handler
// GET /api/orders/[id] — Get order by ID with items and logs
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  handleApiError,
} from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * GET /api/orders/[id]
 * Get an order by its ID with all items and logs.
 *
 * Access:
 *   - Staff, Cashier, Owner
 *   - Staff can only view their own orders
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);
    const { id } = await params;

    const order = await orderService.getOrderById(id);

    // Staff can only view their own orders
    if (user.role === "staff" && order.created_by !== user.id) {
      return apiSuccess(null, "Order not found");
    }

    return apiSuccess(order, "Order retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
