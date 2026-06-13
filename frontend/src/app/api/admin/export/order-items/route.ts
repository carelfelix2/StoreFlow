// =============================================================================
// Felix Snack POS — Admin Backup Export: Order Items CSV
// GET /api/admin/export/order-items
// Owner only. Returns all order items as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/order-items
 * Export all order items as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const items = await prisma.orderItem.findMany({
      include: {
        order: { select: { order_number: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const headers = [
      "id",
      "order_id",
      "order_number",
      "product_id",
      "product_name",
      "unit_name",
      "qty",
      "conversion_to_base",
      "base_qty",
      "price",
      "cost_price",
      "subtotal",
      "created_at",
    ];

    const rows = items.map((i) => [
      i.id,
      i.order_id,
      i.order.order_number,
      i.product_id,
      escapeCsv(i.product_name),
      i.unit_name,
      String(i.qty),
      String(i.conversion_to_base),
      String(i.base_qty),
      String(i.price),
      String(i.cost_price),
      String(i.subtotal),
      i.created_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="order-items-export-${dateStamp()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(headers: string[], rows: string[][]): string {
  return [headers.join(","), ...rows.map((r) => r.join(",")), ""].join("\n");
}

function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}
