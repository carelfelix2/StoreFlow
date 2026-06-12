// =============================================================================
// Felix Snack POS — Stock Management API
// Handles stock-in operations and stock movement queries.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiSuccess, apiPaginated } from "@/lib/api-response";
import type { StockMovementType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/stock?page=1&per_page=20&search=&low_stock=
 * List products with their current stock levels.
 * Owner, cashier, and staff can view.
 */
export async function GET(request: Request) {
  try {
    await requireRole(["owner", "cashier", "staff"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const search = searchParams.get("search") ?? "";
    const lowStock = searchParams.get("low_stock") === "true";

    const where: Record<string, unknown> = { is_active: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (lowStock) {
      // Use raw filter after fetch
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          base_unit: true,
          stock: true,
          min_stock: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    // Apply low_stock filter in JS if requested
    const filteredProducts = lowStock
      ? products.filter((p) => Number(p.stock) <= Number(p.min_stock))
      : products;

    const mapped = filteredProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      base_unit: p.base_unit,
      stock: Number(p.stock),
      min_stock: Number(p.min_stock),
      status:
        Number(p.stock) <= 0
          ? ("out" as const)
          : Number(p.stock) <= Number(p.min_stock)
            ? ("low" as const)
            : ("ok" as const),
      category: p.category,
    }));

    return apiPaginated(
      mapped,
      total,
      page,
      perPage,
      "Stock list retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/stock
 * Stock-in: add stock to a product and create a stock movement record.
 * Owner only.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole(["owner"]);

    const body = await request.json();
    const { product_id, qty, unit_name, unit_qty, notes } = body;

    if (!product_id || !qty) {
      return handleApiError(
        new Error("product_id and qty are required")
      );
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return handleApiError(
        new Error("qty must be a positive number")
      );
    }

    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { id: true, name: true, stock: true, base_unit: true },
    });

    if (!product) {
      return handleApiError(new Error("Product not found"));
    }

    const stockBefore = Number(product.stock);
    const stockAfter = stockBefore + qtyNum;

    // Execute in transaction: update stock + create stock movement
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product_id },
        data: { stock: stockAfter },
        select: {
          id: true,
          name: true,
          stock: true,
          min_stock: true,
          base_unit: true,
          category: { select: { id: true, name: true } },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          product_id,
          type: "stock_in" as StockMovementType,
          qty: qtyNum,
          unit_name: unit_name ?? product.base_unit,
          unit_qty: unit_qty ? Number(unit_qty) : qtyNum,
          stock_before: stockBefore,
          stock_after: stockAfter,
          notes: notes ?? null,
          created_by: user.id,
        },
      });

      return {
        product: {
          ...updated,
          stock: Number(updated.stock),
          min_stock: Number(updated.min_stock),
        },
        movement: {
          id: movement.id,
          type: movement.type,
          qty: Number(movement.qty),
          stock_before: Number(movement.stock_before),
          stock_after: Number(movement.stock_after),
          created_at: movement.created_at.toISOString(),
        },
      };
    });

    return apiSuccess(result, "Stock added successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
