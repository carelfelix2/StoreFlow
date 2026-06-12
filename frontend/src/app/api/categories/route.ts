// =============================================================================
// Felix Snack POS — Categories API Route Handler
// GET  /api/categories       — List categories (owner/cashier: all, staff: active only)
// POST /api/categories       — Create category (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiCreated,
  handleApiError,
  apiPaginated,
} from "@/lib/api-response";
import {
  createCategorySchema,
  categoryQuerySchema,
} from "@/lib/validation/category";
import * as categoryService from "@/server/db/services/category-service";

/**
 * GET /api/categories
 * List categories with optional search, is_active filter, and pagination.
 *
 * Access:
 *   - Owner: all categories
 *   - Cashier: all categories
 *   - Staff: active categories only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = categoryQuerySchema.parse(rawQuery);

    const result = await categoryService.listCategories(query, user.role);

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
 * POST /api/categories
 * Create a new category.
 *
 * Access:
 *   - Owner only
 *
 * Body:
 *   - name: string (required)
 *   - slug: string (optional, auto-generated from name if omitted)
 *   - color: string (optional, hex color)
 *   - icon: string (optional, Lucide icon name)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["owner"]);

    const body = await request.json();
    const input = createCategorySchema.parse(body);

    const category = await categoryService.createCategory(input);

    return apiCreated(category, `Category "${category.name}" created successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
