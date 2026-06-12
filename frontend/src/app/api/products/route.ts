// =============================================================================
// Felix Snack POS — Products API Route
// GET  /api/products  — List products (owner, cashier, staff)
// POST /api/products  — Create product (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiCreated,
  apiPaginated,
  handleApiError,
} from "@/lib/api-response";
import { createProductSchema, productQuerySchema } from "@/lib/validation/product";
import * as productService from "@/server/db/services/product-service";

/**
 * GET /api/products
 * List products with optional search, category_id, is_active, low_stock filters, and pagination.
 *
 * Access:
 *   - Owner: all products
 *   - Cashier: all products
 *   - Staff: active products only
 *
 * Query params:
 *   - search: string (optional)
 *   - category_id: UUID (optional)
 *   - is_active: "true" | "false" (optional)
 *   - low_stock: "true" | "false" (optional)
 *   - page: number (optional, default: 1)
 *   - per_page: number (optional, default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = productQuerySchema.parse(rawQuery);

    const result = await productService.listProducts(query, user.role);

    return apiPaginated(
      result.data,
      result.total,
      result.page,
      result.per_page
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/products
 * Create a new product with units.
 *
 * Access:
 *   - Owner only
 *
 * Body:
 *   - category_id: UUID (required)
 *   - name: string (required)
 *   - sku: string (optional, unique)
 *   - barcode: string (optional)
 *   - image: string (optional, URL)
 *   - base_unit: string (optional, default: "pcs")
 *   - cost_price: number (required, >= 0)
 *   - selling_price: number (required, >= 0)
 *   - stock: number (optional, default: 0, >= 0)
 *   - min_stock: number (optional, default: 0, >= 0)
 *   - units: array of { unit_name, conversion_to_base, selling_price, is_default } (required, min 1)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["owner"]);

    const body = await request.json();
    const input = createProductSchema.parse(body);

    const product = await productService.createProduct(input);

    return apiCreated(product, `Product "${product.name}" created successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
