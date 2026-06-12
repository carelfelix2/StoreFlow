// =============================================================================
// Felix Snack POS — Product Toggle Active API Route
// PATCH /api/products/[id]/toggle  — Toggle product active status (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiError,
  handleApiError,
} from "@/lib/api-response";
import * as productService from "@/server/db/services/product-service";

/**
 * PATCH /api/products/[id]/toggle
 * Toggle a product's active status (activate/deactivate).
 *
 * Access:
 *   - Owner only
 *
 * Response:
 *   - Returns the updated product with new is_active status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    const product = await productService.toggleProductActive(id);

    const status = product.is_active ? "activated" : "deactivated";
    return apiSuccess(product, `Product "${product.name}" ${status} successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
