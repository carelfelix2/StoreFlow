// =============================================================================
// Felix Snack POS — Category Detail API Route Handler
// GET    /api/categories/[id]  — Get category by ID
// PUT    /api/categories/[id]  — Update category (owner only)
// DELETE /api/categories/[id]  — Soft delete / deactivate category (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiDeleted,
  handleApiError,
  apiError,
} from "@/lib/api-response";
import {
  updateCategorySchema,
} from "@/lib/validation/category";
import * as categoryService from "@/server/db/services/category-service";

/**
 * GET /api/categories/[id]
 * Get a single category by ID.
 *
 * Access:
 *   - Owner: any category
 *   - Cashier: any category
 *   - Staff: active categories only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);
    const { id } = await params;

    const category = await categoryService.getCategoryById(id, user.role);
    if (!category) {
      return apiError("Category not found", 404);
    }

    return apiSuccess(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/categories/[id]
 * Update an existing category.
 *
 * Access:
 *   - Owner only
 *
 * Body (all optional):
 *   - name: string
 *   - slug: string (must be unique)
 *   - color: string (hex) | null
 *   - icon: string | null
 *   - is_active: boolean
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    const body = await request.json();
    const input = updateCategorySchema.parse(body);

    // Ensure at least one field is provided
    if (Object.keys(input).length === 0) {
      return apiError("At least one field must be provided for update", 400);
    }

    const category = await categoryService.updateCategory(id, input);

    return apiSuccess(category, `Category "${category.name}" updated successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/categories/[id]
 * Soft delete (deactivate) a category.
 *
 * Access:
 *   - Owner only
 *
 * Rules:
 *   - Category must not have active products
 *   - Uses soft delete (sets is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["owner"]);
    const { id } = await params;

    const category = await categoryService.deleteCategory(id);

    return apiDeleted(`Category "${category.name}" deactivated successfully`);
  } catch (error) {
    return handleApiError(error);
  }
}
