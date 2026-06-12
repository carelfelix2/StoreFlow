// =============================================================================
// Felix Snack POS — Stock Movements API
// Paginated list of all stock movements.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiPaginated } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/stock/movements?page=1&per_page=20&product_id=&type=
 * List stock movements with product and user info, newest first.
 */
export async function GET(request: Request) {
  try {
    await requireRole(["owner", "cashier", "staff"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const perPage = parseInt(searchParams.get("per_page") ?? "20");
    const productId = searchParams.get("product_id");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (productId) {
      where.product_id = productId;
    }

    if (type) {
      where.type = type;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, base_unit: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    const mapped = movements.map((m) => ({
      id: m.id,
      product_id: m.product_id,
      product_name: m.product.name,
      product_unit: m.product.base_unit,
      type: m.type,
      qty: Number(m.qty),
      unit_name: m.unit_name,
      unit_qty: m.unit_qty ? Number(m.unit_qty) : null,
      stock_before: Number(m.stock_before),
      stock_after: Number(m.stock_after),
      notes: m.notes,
      created_by: m.user.name,
      created_at: m.created_at.toISOString(),
    }));

    return apiPaginated(
      mapped,
      total,
      page,
      perPage,
      "Stock movements retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
