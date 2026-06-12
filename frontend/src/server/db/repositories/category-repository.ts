// =============================================================================
// Felix Snack POS — Category Repository
// Data access layer for categories. All Prisma queries for categories
// flow through this repository to ensure consistent query patterns.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  _count: {
    products: number;
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find all categories with optional filtering and pagination.
 */
export async function findMany(
  filters: CategoryFilters = {}
): Promise<{ data: CategoryWithCount[]; total: number }> {
  const { search, is_active, page = 1, per_page = 20 } = filters;

  const where: Prisma.CategoryWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
    prisma.category.count({ where }),
  ]);

  return { data, total };
}

/**
 * Find a category by its ID.
 */
export async function findById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

/**
 * Find a category by its slug.
 */
export async function findBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

/**
 * Create a new category.
 */
export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

/**
 * Update an existing category.
 */
export async function update(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

/**
 * Soft delete a category by setting is_active = false.
 */
export async function softDelete(id: string) {
  return prisma.category.update({
    where: { id },
    data: { is_active: false },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

/**
 * Count active products belonging to a category.
 */
export async function countActiveProductsByCategory(
  categoryId: string
): Promise<number> {
  return prisma.product.count({
    where: {
      category_id: categoryId,
      is_active: true,
    },
  });
}
