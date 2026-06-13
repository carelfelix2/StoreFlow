// =============================================================================
// Felix Snack POS — Customer Display Clear API Route Handler
// POST /api/customer-display/[deviceId]/clear
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { clearDisplayState } from "@/server/customer-display/display-state";

/**
 * POST /api/customer-display/[deviceId]/clear
 *
 * Clear the customer display for a device — returns to idle state.
 *
 * Access:
 *   - Cashier, Owner
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    await requireRole(["owner", "cashier"]);
    const { deviceId } = await params;

    const state = clearDisplayState(deviceId);

    return apiSuccess({
      device_id: deviceId,
      state: state.state,
      order_id: state.order_id,
      updated_at: state.updated_at,
    }, "Display cleared");
  } catch (error) {
    return handleApiError(error);
  }
}
