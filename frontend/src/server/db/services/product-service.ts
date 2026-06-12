// =============================================================================
// Felix Snack POS — Product Service
// Business logic layer for product operations.
// Services orchestrate repositories and enforce business rules.
// =============================================================================

import * as productRepository from "@/server/db/repositories/product-repository";
import * as categoryRepository from "@/server/db/repositories/category-repository";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from "@/lib/validation/product";
import { AuthError } from "@/lib/auth-helpers";
import type { Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductUnitResponse {
  id: string;
  unit_name: string;
  conversion_to_base: number;
  selling_price: number;
  is_default: boolean;
}

export interface ProductResponse {
  id: string;
  category_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  };
  units: ProductUnitResponse[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toUnitResponse(unit: {
  id: string;
  unit_name: string;
  conversion_to_base: Prisma.Decimal;
  selling_price: Prisma.Decimal;
  is_default: boolean;
}): ProductUnitResponse {
  return {
    id: unit.id,
    unit_name: unit.unit_name,
    conversion_to_base: Number(unit.conversion_to_base),
    selling_price: Number(unit.selling_price),
    is_default: unit.is_default,
  };
}

function toResponse(item: productRepository.ProductWithRelations): ProductResponse {
  return {
    id: item.id,
    category_id: item.category_id,
    name: item.name,
    sku: item.sku,
    barcode: item.barcode,
    image: item.image,
    base_unit: item.base_unit,
    cost_price: Number(item.cost_price),
    selling_price: Number(item.selling_price),
    stock: Number(item.stock),
    min_stock: Number(item.min_stock),
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
    category: item.category,
    units: item.units.map(toUnitResponse),
  };
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a category exists and is active.
 */
async function validateCategory(categoryId: string): Promise<void> {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new AuthError("Category not found", 404);
  }
  if (!category.is_active) {
    throw new AuthError("Cannot assign product to an inactive category", 409);
  }
}

/**
 * Validate SKU uniqueness.
 */
async function validateSkuUniqueness(
  sku: string,
  excludeProductId?: string
): Promise<void> {
  const existing = await productRepository.findBySku(sku);
  if (existing && existing.id !== excludeProductId) {
    throw new AuthError(`Product with SKU "${sku}" already exists`, 409);
  }
}

/**
 * Validate barcode uniqueness.
 */
async function validateBarcodeUniqueness(
  barcode: string,
  excludeProductId?: string
): Promise<void> {
  const existing = await productRepository.findByBarcode(barcode);
  if (existing && existing.id !== excludeProductId) {
    throw new AuthError(`Product with barcode "${barcode}" already exists`, 409);
  }
}

/**
 * Ensure exactly one unit is marked as default.
 * If no unit is marked as default, the first unit becomes default.
 */
function ensureDefaultUnit(
  units: Array<{ unit_name: string; conversion_to_base: number | Prisma.Decimal; selling_price: number | Prisma.Decimal; is_default: boolean }>
): Array<{ unit_name: string; conversion_to_base: number | Prisma.Decimal; selling_price: number | Prisma.Decimal; is_default: boolean }> {
  const defaultCount = units.filter((u) => u.is_default).length;

  if (defaultCount === 0) {
    // Mark first unit as default
    return units.map((u, i) => ({ ...u, is_default: i === 0 }));
  }

  if (defaultCount > 1) {
    // Keep only the first default, unmark others
    let foundFirst = false;
    return units.map((u) => {
      if (u.is_default && !foundFirst) {
        foundFirst = true;
        return u;
      }
      return { ...u, is_default: false };
    });
  }

  return units;
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

/**
 * List products with optional filtering and pagination.
 * Cashier can view all products. Staff can view active products only.
 */
export async function listProducts(query: ProductQueryInput, userRole: string) {
  const filters: productRepository.ProductFilters = {
    search: query.search,
    category_id: query.category_id,
    page: query.page,
    per_page: query.per_page,
  };

  // Staff can only see active products
  if (userRole === "staff") {
    filters.is_active = true;
  } else if (query.is_active !== undefined) {
    filters.is_active = query.is_active;
  }

  // Low stock filter
  if (query.low_stock) {
    filters.low_stock = true;
  }

  const { data, total } = await productRepository.findMany(filters);

  return {
    data: data.map(toResponse),
    total,
    page: query.page,
    per_page: query.per_page,
  };
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id: string, userRole: string) {
  const product = await productRepository.findById(id);
  if (!product) return null;

  // Staff can only view active products
  if (userRole === "staff" && !product.is_active) return null;

  return toResponse(product);
}

/**
 * Create a new product with units. Owner only.
 */
export async function createProduct(input: CreateProductInput) {
  // Validate category exists and is active
  await validateCategory(input.category_id);

  // Validate SKU uniqueness if provided
  if (input.sku) {
    await validateSkuUniqueness(input.sku);
  }

  // Validate barcode uniqueness if provided
  if (input.barcode) {
    await validateBarcodeUniqueness(input.barcode);
  }

  // Ensure exactly one default unit
  const units = ensureDefaultUnit(input.units);

  // Prepare product data
  const productData: Prisma.ProductCreateInput = {
    category: { connect: { id: input.category_id } },
    name: input.name,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    image: input.image ?? null,
    base_unit: input.base_unit,
    cost_price: input.cost_price,
    selling_price: input.selling_price,
    stock: input.stock,
    min_stock: input.min_stock,
  };

  const product = await productRepository.createWithUnits(
    productData,
    units.map((u) => ({
      unit_name: u.unit_name,
      conversion_to_base: u.conversion_to_base,
      selling_price: u.selling_price,
      is_default: u.is_default,
    }))
  );

  return toResponse(product);
}

/**
 * Update an existing product. Owner only.
 */
export async function updateProduct(id: string, input: UpdateProductInput) {
  // Verify product exists
  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new AuthError("Product not found", 404);
  }

  // Validate category if being changed
  if (input.category_id) {
    await validateCategory(input.category_id);
  }

  // Validate SKU uniqueness if being changed
  if (input.sku && input.sku !== existing.sku) {
    await validateSkuUniqueness(input.sku, id);
  }

  // Validate barcode uniqueness if being changed
  if (input.barcode && input.barcode !== existing.barcode) {
    await validateBarcodeUniqueness(input.barcode, id);
  }

  // Build update data
  const updateData: Record<string, unknown> = {};
  if (input.category_id !== undefined) {
    updateData.category = { connect: { id: input.category_id } };
  }
  if (input.name !== undefined) updateData.name = input.name;
  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.barcode !== undefined) updateData.barcode = input.barcode;
  if (input.image !== undefined) updateData.image = input.image;
  if (input.base_unit !== undefined) updateData.base_unit = input.base_unit;
  if (input.cost_price !== undefined) updateData.cost_price = input.cost_price;
  if (input.selling_price !== undefined) updateData.selling_price = input.selling_price;
  if (input.stock !== undefined) updateData.stock = input.stock;
  if (input.min_stock !== undefined) updateData.min_stock = input.min_stock;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  // Handle units update if provided
  let units: productRepository.ProductUnitData[] | undefined;
  if (input.units) {
    const normalizedUnits = ensureDefaultUnit(input.units);
    units = normalizedUnits.map((u) => ({
      unit_name: u.unit_name,
      conversion_to_base: u.conversion_to_base,
      selling_price: u.selling_price,
      is_default: u.is_default,
    }));
  }

  const product = await productRepository.updateWithUnits(id, updateData, units);
  return toResponse(product);
}

/**
 * Soft-delete (deactivate) a product. Owner only.
 */
export async function deleteProduct(id: string) {
  // Verify product exists
  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new AuthError("Product not found", 404);
  }

  // Soft delete by setting is_active = false
  const product = await productRepository.softDelete(id);
  return toResponse(product);
}

/**
 * Toggle product active status. Owner only.
 */
export async function toggleProductActive(id: string) {
  // Verify product exists
  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new AuthError("Product not found", 404);
  }

  const product = await productRepository.toggleActive(id, !existing.is_active);
  return toResponse(product);
}
