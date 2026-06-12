// =============================================================================
// Felix Snack POS — Category Service
// Business logic layer for category operations.
// Services orchestrate repositories and enforce business rules.
// =============================================================================

import * as categoryRepository from "@/server/db/repositories/category-repository";
import type { CreateCategoryInput, UpdateCategoryInput, CategoryQueryInput } from "@/lib/validation/category";
import { AuthError } from "@/lib/auth-helpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_count: number;
}

function toResponse(item: {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  _count: { products: number };
}): CategoryResponse {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    color: item.color,
    icon: item.icon,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
    product_count: item._count.products,
  };
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * List categories with optional filtering and pagination.
 * Cashier can view all categories. Staff can view active categories only.
 */
export async function listCategories(
  query: CategoryQueryInput,
  userRole: string
) {
  const filters: categoryRepository.CategoryFilters = {
    search: query.search,
    page: query.page,
    per_page: query.per_page,
  };

  // Staff can only see active categories
  if (userRole === "staff") {
    filters.is_active = true;
  } else if (query.is_active !== undefined) {
    filters.is_active = query.is_active;
  }

  const { data, total } = await categoryRepository.findMany(filters);

  return {
    data: data.map(toResponse),
    total,
    page: query.page,
    per_page: query.per_page,
  };
}

/**
 * Get a single category by ID.
 */
export async function getCategoryById(id: string, userRole: string) {
  const category = await categoryRepository.findById(id);
  if (!category) return null;

  // Staff can only view active categories
  if (userRole === "staff" && !category.is_active) return null;

  return toResponse(category);
}

/**
 * Create a new category. Owner only.
 */
export async function createCategory(input: CreateCategoryInput) {
  // Auto-generate slug from name if not provided
  const slug =
    input.slug ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  // Check slug uniqueness
  const existing = await categoryRepository.findBySlug(slug);
  if (existing) {
    throw new AuthError(`Category with slug "${slug}" already exists`, 409);
  }

  const category = await categoryRepository.create({
    name: input.name,
    slug,
    color: input.color ?? null,
    icon: input.icon ?? null,
  });

  return toResponse(category);
}

/**
 * Update an existing category. Owner only.
 */
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  // Verify category exists
  const existing = await categoryRepository.findById(id);
  if (!existing) {
    throw new AuthError("Category not found", 404);
  }

  // If slug is being changed, check uniqueness
  if (input.slug && input.slug !== existing.slug) {
    const slugExists = await categoryRepository.findBySlug(input.slug);
    if (slugExists) {
      throw new AuthError(
        `Category with slug "${input.slug}" already exists`,
        409
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const category = await categoryRepository.update(id, updateData);
  return toResponse(category);
}

/**
 * Soft-delete (deactivate) a category. Owner only.
 * Cannot deactivate if category still has active products.
 */
export async function deleteCategory(id: string) {
  // Verify category exists
  const existing = await categoryRepository.findById(id);
  if (!existing) {
    throw new AuthError("Category not found", 404);
  }

  // Check if category has active products
  const activeProductCount =
    await categoryRepository.countActiveProductsByCategory(id);
  if (activeProductCount > 0) {
    throw new AuthError(
      `Cannot delete category "${existing.name}": it still has ${activeProductCount} active product(s). Move or deactivate them first.`,
      409
    );
  }

  // Soft delete by setting is_active = false
  const category = await categoryRepository.softDelete(id);
  return toResponse(category);
}
