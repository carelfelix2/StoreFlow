// =============================================================================
// Felix Snack POS — Admin Backup Export: Payments CSV
// GET /api/admin/export/payments
// Owner only. Returns all payments as CSV download.
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/payments
 * Export all payments as CSV.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const payments = await prisma.payment.findMany({
      include: {
        order: { select: { order_number: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const headers = [
      "id",
      "order_id",
      "order_number",
      "method",
      "status",
      "amount",
      "paid_amount",
      "change_amount",
      "gateway",
      "gateway_reference",
      "expired_at",
      "paid_at",
      "created_at",
      "updated_at",
    ];

    const rows = payments.map((p) => [
      p.id,
      p.order_id,
      p.order.order_number,
      p.method,
      p.status,
      String(p.amount),
      String(p.paid_amount),
      String(p.change_amount),
      p.gateway ?? "",
      p.gateway_reference ?? "",
      p.expired_at?.toISOString() ?? "",
      p.paid_at?.toISOString() ?? "",
      p.created_at.toISOString(),
      p.updated_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payments-export-${dateStamp()}.csv"`,
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
