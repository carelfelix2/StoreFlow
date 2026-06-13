// =============================================================================
// Felix Snack POS — Admin Backup Export: Stock Movements CSV
// GET /api/admin/export/stock-movements
// Owner only. Returns all stock movements as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/stock-movements
 * Export all stock movements as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const movements = await prisma.stockMovement.findMany({
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
        order: { select: { order_number: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const headers = [
      "id",
      "product_id",
      "product_name",
      "order_id",
      "order_number",
      "type",
      "qty",
      "unit_name",
      "unit_qty",
      "stock_before",
      "stock_after",
      "notes",
      "created_by",
      "created_at",
    ];

    const rows = movements.map((m) => [
      m.id,
      m.product_id,
      escapeCsv(m.product.name),
      m.order_id ?? "",
      m.order?.order_number ?? "",
      m.type,
      String(m.qty),
      m.unit_name ?? "",
      m.unit_qty ? String(m.unit_qty) : "",
      String(m.stock_before),
      String(m.stock_after),
      escapeCsv(m.notes ?? ""),
      m.user.name,
      m.created_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stock-movements-export-${dateStamp()}.csv"`,
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
