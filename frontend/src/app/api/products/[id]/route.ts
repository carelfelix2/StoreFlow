// =============================================================================
// Felix Snack POS — Product Detail API Route
// GET    /api/products/[id]  — Get product detail (owner, cashier, staff)
// PUT    /api/products/[id]  — Update product (owner only)
// DELETE /api/products/[id]  — Soft delete product (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiDeleted,
  apiError,
  handleApiError,
} from "@/lib/api-response";
import { updateProductSchema } from "@/lib/validation/product";
import * as productService from "@/server/db/services/product-service";

/**
 * GET /api/products/[id]
 * Get a single product by ID with category and units.
 *
 * Access:
 *   - Owner: any product
 *   - Cashier: any product
 *   - Staff: active products only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);
    const { id } = await params;

    const product = await productService.getProductById(id, user.role);

    if (!product) {
      return apiError("Product not found", 404);
    }

    return apiSuccess(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/products/[id]
 * Update an existing product. Owner only.
 *
 * Access:
 *   - Owner only
 *
 * Body: partial product fields (all optional)
 *   - category_id: UUID
 *   - name: string
 *   - sku: string (nullable)
 *   - barcode: string (nullable)
 *   - image: string (nullable, URL)
 *   - base_unit: string
 *   - cost_price: number (>= 0)
 *   - selling_price: number (>= 0)
 *   - stock: number (>= 0)
 *   - min_stock: number (>= 0)
 *   - is_active: boolean
 *   - units: array of { unit_name, conversion_to_base, selling_price, is_default }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    const body = await request.json();
    const input = updateProductSchema.parse(body);

    // Validate at least one field is provided
    if (Object.keys(input).length === 0) {
      return apiError("No fields to update", 400);
    }

    const product = await productService.updateProduct(id, input);

    return apiSuccess(product, `Product "${product.name}" updated successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/products/[id]
 * Soft delete a product by setting is_active = false.
 *
 * Access:
 *   - Owner only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    await productService.deleteProduct(id);

    return apiDeleted("Product deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
