// =============================================================================
// Felix Snack POS — Admin Backup Export: Products CSV
// GET /api/admin/export/products
// Owner only. Returns all products as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/products
 * Export all products (including inactive) as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "id",
      "name",
      "sku",
      "barcode",
      "category",
      "base_unit",
      "cost_price",
      "selling_price",
      "stock",
      "min_stock",
      "is_active",
      "created_at",
      "updated_at",
    ];

    const rows = products.map((p) => [
      p.id,
      escapeCsv(p.name),
      p.sku ?? "",
      p.barcode ?? "",
      p.category.name,
      p.base_unit,
      String(p.cost_price),
      String(p.selling_price),
      String(p.stock),
      String(p.min_stock),
      p.is_active ? "true" : "false",
      p.created_at.toISOString(),
      p.updated_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="products-export-${dateStamp()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// CSV Helpers
// ---------------------------------------------------------------------------

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.join(","));
  return [headerLine, ...dataLines, ""].join("\n");
}

function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}
