// =============================================================================
// Felix Snack POS — Admin Backup Export: Orders CSV
// GET /api/admin/export/orders
// Owner only. Returns all orders as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/orders
 * Export all orders as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const orders = await prisma.order.findMany({
      include: {
        staff: { select: { name: true } },
        cashier: { select: { name: true } },
        customer: { select: { name: true, type: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const headers = [
      "id",
      "order_number",
      "customer_name",
      "customer_type",
      "created_by",
      "cashier_name",
      "status",
      "subtotal",
      "discount_total",
      "tax_total",
      "grand_total",
      "notes",
      "submitted_at",
      "approved_at",
      "paid_at",
      "completed_at",
      "cancelled_at",
      "created_at",
      "updated_at",
    ];

    const rows = orders.map((o) => [
      o.id,
      o.order_number,
      o.customer_name ?? (o.customer?.name ?? ""),
      o.customer?.type ?? "",
      o.staff.name,
      o.cashier?.name ?? "",
      o.status,
      String(o.subtotal),
      String(o.discount_total),
      String(o.tax_total),
      String(o.grand_total),
      escapeCsv(o.notes ?? ""),
      o.submitted_at?.toISOString() ?? "",
      o.approved_at?.toISOString() ?? "",
      o.paid_at?.toISOString() ?? "",
      o.completed_at?.toISOString() ?? "",
      o.cancelled_at?.toISOString() ?? "",
      o.created_at.toISOString(),
      o.updated_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-export-${dateStamp()}.csv"`,
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
