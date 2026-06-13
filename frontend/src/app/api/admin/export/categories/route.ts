// =============================================================================
// Felix Snack POS — Admin Backup Export: Categories CSV
// GET /api/admin/export/categories
// Owner only. Returns all categories as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/categories
 * Export all categories as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    const headers = ["id", "name", "slug", "color", "icon", "is_active", "created_at", "updated_at"];
    const rows = categories.map((c) => [
      c.id,
      escapeCsv(c.name),
      c.slug,
      c.color ?? "",
      c.icon ?? "",
      c.is_active ? "true" : "false",
      c.created_at.toISOString(),
      c.updated_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="categories-export-${dateStamp()}.csv"`,
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
