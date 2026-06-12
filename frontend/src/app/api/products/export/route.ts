// =============================================================================
// Felix Snack POS — Product Export API Route
// GET /api/products/export — Export all products as CSV (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/export
 * Export all products as a CSV file download.
 *
 * Access:
 *   - Owner only
 *
 * CSV Columns:
 *   name, category_name, sku, barcode, base_unit, cost_price, selling_price,
 *   stock, min_stock, is_active, units_json
 *
 * units_json is a JSON stringified array of { unit_name, conversion_to_base, selling_price, is_default }
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner"]);

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
        units: {
          orderBy: { unit_name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build CSV header
    const headers = [
      "name",
      "category_name",
      "sku",
      "barcode",
      "base_unit",
      "cost_price",
      "selling_price",
      "stock",
      "min_stock",
      "is_active",
      "units_json",
    ];

    // Build CSV rows
    const rows = products.map((p) => {
      const units = p.units.map((u) => ({
        unit_name: u.unit_name,
        conversion_to_base: Number(u.conversion_to_base),
        selling_price: Number(u.selling_price),
        is_default: u.is_default,
      }));

      return [
        escapeCsvField(p.name),
        escapeCsvField(p.category.name),
        escapeCsvField(p.sku ?? ""),
        escapeCsvField(p.barcode ?? ""),
        escapeCsvField(p.base_unit),
        String(Number(p.cost_price)),
        String(Number(p.selling_price)),
        String(Number(p.stock)),
        String(Number(p.min_stock)),
        p.is_active ? "true" : "false",
        escapeCsvField(JSON.stringify(units)),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Add BOM for Excel compatibility with UTF-8
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="products-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Escape a CSV field value — wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
