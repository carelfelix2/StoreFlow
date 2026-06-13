// =============================================================================
// Felix Snack POS — Admin Health Check / Data Integrity API
// GET /api/admin/health-check
// Owner only. Checks database integrity and returns any issues found.
// =============================================================================

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface HealthIssue {
  type: string;
  severity: "warning" | "error";
  message: string;
  reference_id: string | null;
  details: Record<string, unknown> | null;
}

interface HealthCheckResult {
  status: "healthy" | "warning" | "error";
  summary: string;
  timestamp: string;
  checks: {
    label: string;
    status: "passed" | "warning" | "error";
    count: number;
  }[];
  issues: HealthIssue[];
}

/**
 * GET /api/admin/health-check
 *
 * Checks:
 * 1. Products with negative stock
 * 2. Orders paid without any payment record
 * 3. Payments paid without paid_at timestamp
 * 4. Stock movements missing product reference
 * 5. Orders with grand_total mismatch vs items subtotal sum
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const issues: HealthIssue[] = [];
    const checks: HealthCheckResult["checks"] = [];

    // -----------------------------------------------------------------------
    // Check 1: Products with negative stock
    // -----------------------------------------------------------------------
    const negativeStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 0 } },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
      },
      orderBy: { stock: "asc" },
    });

    checks.push({
      label: "Products with negative stock",
      status: negativeStockProducts.length === 0 ? "passed" : "error",
      count: negativeStockProducts.length,
    });

    for (const p of negativeStockProducts) {
      issues.push({
        type: "negative_stock",
        severity: "error",
        message: `Product "${p.name}" (SKU: ${p.sku ?? "N/A"}) has negative stock: ${p.stock}`,
        reference_id: p.id,
        details: { name: p.name, sku: p.sku, stock: Number(p.stock) },
      });
    }

    // -----------------------------------------------------------------------
    // Check 2: Orders paid without any payment record
    // -----------------------------------------------------------------------
    const paidOrdersWithoutPayment = await prisma.order.findMany({
      where: {
        status: { in: ["paid", "completed"] },
        payments: { none: {} },
      },
      select: {
        id: true,
        order_number: true,
        status: true,
        grand_total: true,
      },
      orderBy: { created_at: "desc" },
    });

    checks.push({
      label: "Paid/completed orders without payment records",
      status: paidOrdersWithoutPayment.length === 0 ? "passed" : "error",
      count: paidOrdersWithoutPayment.length,
    });

    for (const o of paidOrdersWithoutPayment) {
      issues.push({
        type: "paid_order_no_payment",
        severity: "error",
        message: `Order #${o.order_number} is "${o.status}" but has no payment records`,
        reference_id: o.id,
        details: { order_number: o.order_number, status: o.status, grand_total: Number(o.grand_total) },
      });
    }

    // -----------------------------------------------------------------------
    // Check 3: Payments paid without paid_at timestamp
    // -----------------------------------------------------------------------
    const paidPaymentsWithoutPaidAt = await prisma.payment.findMany({
      where: {
        status: "paid",
        paid_at: null,
      },
      select: {
        id: true,
        method: true,
        amount: true,
        order: { select: { order_number: true } },
      },
      orderBy: { created_at: "desc" },
    });

    checks.push({
      label: "Paid payments without paid_at timestamp",
      status: paidPaymentsWithoutPaidAt.length === 0 ? "passed" : "warning",
      count: paidPaymentsWithoutPaidAt.length,
    });

    for (const p of paidPaymentsWithoutPaidAt) {
      issues.push({
        type: "paid_no_timestamp",
        severity: "warning",
        message: `Payment #${p.id} for Order #${p.order.order_number} is "paid" but missing paid_at`,
        reference_id: p.id,
        details: { order_number: p.order.order_number, method: p.method, amount: Number(p.amount) },
      });
    }

    // -----------------------------------------------------------------------
    // Check 4: Stock movements with invalid (deleted) product reference
    // -----------------------------------------------------------------------
    const orphanMovements = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT sm.id FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      WHERE p.id IS NULL
      LIMIT 10
    `;

    checks.push({
      label: "Stock movements missing product",
      status: orphanMovements.length === 0 ? "passed" : "error",
      count: orphanMovements.length,
    });

    for (const m of orphanMovements) {
      issues.push({
        type: "orphan_stock_movement",
        severity: "error",
        message: `Stock movement ${m.id} references a deleted product`,
        reference_id: m.id,
        details: { movement_id: m.id },
      });
    }

    // -----------------------------------------------------------------------
    // Check 5: Orders with grand_total mismatch vs sum of items subtotal
    // -----------------------------------------------------------------------
    const mismatchedOrders = await prisma.$queryRaw<
      Array<{
        id: string;
        order_number: string;
        grand_total: number;
        items_sum: number;
        diff: number;
      }>
    >`
      SELECT
        o.id,
        o.order_number,
        CAST(o.grand_total AS NUMERIC(15,2)) as grand_total,
        COALESCE(CAST(SUM(oi.subtotal) AS NUMERIC(15,2)), 0) as items_sum,
        CAST(ABS(o.grand_total - COALESCE(SUM(oi.subtotal), 0)) AS NUMERIC(15,2)) as diff
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id, o.order_number, o.grand_total
      HAVING ABS(o.grand_total - COALESCE(SUM(oi.subtotal), 0)) > 0.01
      ORDER BY diff DESC
      LIMIT 50
    `;

    checks.push({
      label: "Orders with grand_total mismatch",
      status: mismatchedOrders.length === 0 ? "passed" : "error",
      count: mismatchedOrders.length,
    });

    for (const o of mismatchedOrders) {
      issues.push({
        type: "grand_total_mismatch",
        severity: "error",
        message: `Order #${o.order_number}: grand_total (${Number(o.grand_total).toFixed(2)}) != items subtotal sum (${Number(o.items_sum).toFixed(2)})`,
        reference_id: o.id,
        details: {
          order_number: o.order_number,
          grand_total: Number(o.grand_total),
          items_sum: Number(o.items_sum),
          difference: Number(o.diff),
        },
      });
    }

    // -----------------------------------------------------------------------
    // Determine overall status
    // -----------------------------------------------------------------------
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    let status: HealthCheckResult["status"] = "healthy";
    let summary = "All data integrity checks passed.";

    if (errorCount > 0) {
      status = "error";
      summary = `${errorCount} error(s) found that require attention.`;
    } else if (warningCount > 0) {
      status = "warning";
      summary = `${warningCount} warning(s) found. Review recommended.`;
    }

    return apiSuccess(
      {
        status,
        summary,
        checks,
        issues,
        timestamp: new Date().toISOString(),
      } satisfies HealthCheckResult,
      summary
    );
  } catch (error) {
    return handleApiError(error);
  }
}
