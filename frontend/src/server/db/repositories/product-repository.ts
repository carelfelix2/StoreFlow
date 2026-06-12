// =============================================================================
// Felix Snack POS — Product Repository
// Data access layer for products. All Prisma queries for products
// and product units flow through this repository.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}

export interface ProductWithRelations {
  id: string;
  category_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  base_unit: string;
  cost_price: Prisma.Decimal;
  selling_price: Prisma.Decimal;
  stock: Prisma.Decimal;
  min_stock: Prisma.Decimal;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  };
  units: Array<{
    id: string;
    product_id: string;
    unit_name: string;
    conversion_to_base: Prisma.Decimal;
    selling_price: Prisma.Decimal;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  }>;
}

export interface ProductUnitData {
  unit_name: string;
  conversion_to_base: Prisma.Decimal | number;
  selling_price: Prisma.Decimal | number;
  is_default: boolean;
}

// ---------------------------------------------------------------------------
// Query Helpers
// ---------------------------------------------------------------------------

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      is_active: true,
    },
  },
  units: {
    orderBy: { unit_name: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Find all products with optional filtering and pagination.
 */
export async function findMany(
  filters: ProductFilters = {}
): Promise<{ data: ProductWithRelations[]; total: number }> {
  const { search, category_id, is_active, low_stock, page = 1, per_page = 20 } = filters;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category_id) {
    where.category_id = category_id;
  }

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  if (low_stock) {
    where.stock = { lte: prisma.product.fields.min_stock };
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: "asc" },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
}

/**
 * Find a product by its ID with category and units.
 */
export async function findById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

/**
 * Find a product by its SKU.
 */
export async function findBySku(sku: string) {
  return prisma.product.findUnique({
    where: { sku },
    include: productInclude,
  });
}

/**
 * Find a product by its barcode.
 */
export async function findByBarcode(barcode: string) {
  return prisma.product.findFirst({
    where: { barcode },
    include: productInclude,
  });
}

/**
 * Create a new product with its units in a transaction.
 */
export async function createWithUnits(
  productData: Prisma.ProductCreateInput,
  units: ProductUnitData[]
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: productData,
      include: productInclude,
    });

    const createdUnits = await Promise.all(
      units.map((unit) =>
        tx.productUnit.create({
          data: {
            product_id: product.id,
            unit_name: unit.unit_name,
            conversion_to_base: unit.conversion_to_base,
            selling_price: unit.selling_price,
            is_default: unit.is_default,
          },
        })
      )
    );

    return { ...product, units: createdUnits };
  });
}

/**
 * Update a product and optionally replace its units in a transaction.
 * If units are provided, existing units are deleted and new ones are created.
 */
export async function updateWithUnits(
  id: string,
  productData: Prisma.ProductUpdateInput,
  units?: ProductUnitData[]
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: productData,
      include: productInclude,
    });

    if (units) {
      // Delete existing units
      await tx.productUnit.deleteMany({
        where: { product_id: id },
      });

      // Create new units
      const createdUnits = await Promise.all(
        units.map((unit) =>
          tx.productUnit.create({
            data: {
              product_id: id,
              unit_name: unit.unit_name,
              conversion_to_base: unit.conversion_to_base,
              selling_price: unit.selling_price,
              is_default: unit.is_default,
            },
          })
        )
      );

      return { ...product, units: createdUnits };
    }

    return product;
  });
}

/**
 * Soft delete a product by setting is_active = false.
 */
export async function softDelete(id: string) {
  return prisma.product.update({
    where: { id },
    data: { is_active: false },
    include: productInclude,
  });
}

/**
 * Toggle product active status.
 */
export async function toggleActive(id: string, is_active: boolean) {
  return prisma.product.update({
    where: { id },
    data: { is_active },
    include: productInclude,
  });
}

/**
 * Count products matching the given filters.
 */
export async function count(filters: ProductFilters = {}): Promise<number> {
  const { search, category_id, is_active, low_stock } = filters;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category_id) {
    where.category_id = category_id;
  }

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  if (low_stock) {
    where.stock = { lte: prisma.product.fields.min_stock };
  }

  return prisma.product.count({ where });
}
