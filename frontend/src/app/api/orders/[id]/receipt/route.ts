// =============================================================================
// Felix Snack POS — Order Receipt API Route Handler
// GET /api/orders/[id]/receipt — Get receipt data for a paid order
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as orderService from "@/server/db/services/order-service";

/**
 * GET /api/orders/[id]/receipt
 * Get receipt data for a paid order.
 *
 * Access:
 *   - Cashier, Owner only
 *
 * Business rules:
 *   - Receipt only available for paid or printed orders
 *   - Printing does not change stock
 *   - If already printed, is_printed = true in response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier"]);
    const { id } = await params;

    const receipt = await orderService.getReceiptData(id);

    return apiSuccess(
      receipt,
      `Receipt data for ${receipt.order_number}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
