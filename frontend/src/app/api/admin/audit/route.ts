// =============================================================================
// Felix Snack POS — Admin Audit View API
// GET /api/admin/audit?type=order_logs&limit=50
// Owner only. Returns recent audit trail entries.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit?type=order_logs&limit=50
 *
 * Query params:
 *   - type: "order_logs" | "payment_logs" | "stock_movements" | "all" (default)
 *   - limit: number (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner"]);

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") ?? "all";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50"),
      200
    );

    const result: Record<string, unknown[]> = {};

    if (type === "order_logs" || type === "all") {
      const orderLogs = await prisma.orderLog.findMany({
        include: {
          user: { select: { id: true, name: true } },
          order: { select: { id: true, order_number: true, status: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      result.order_logs = orderLogs.map((l) => ({
        id: l.id,
        order_id: l.order_id,
        order_number: l.order.order_number,
        order_status: l.order.status,
        user_name: l.user?.name ?? "System",
        action: l.action,
        old_value: l.old_value,
        new_value: l.new_value,
        created_at: l.created_at.toISOString(),
      }));
    }

    if (type === "payment_logs" || type === "all") {
      const paymentLogs = await prisma.paymentLog.findMany({
        include: {
          user: { select: { id: true, name: true } },
          payment: {
            select: {
              id: true,
              method: true,
              status: true,
              amount: true,
              order: { select: { order_number: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      result.payment_logs = paymentLogs.map((l) => ({
        id: l.id,
        payment_id: l.payment_id,
        order_number: l.payment.order.order_number,
        method: l.payment.method,
        amount: Number(l.payment.amount),
        payment_status: l.payment.status,
        user_name: l.user?.name ?? "System",
        event: l.event,
        payload: l.payload,
        created_at: l.created_at.toISOString(),
      }));
    }

    if (type === "stock_movements" || type === "all") {
      const stockMovements = await prisma.stockMovement.findMany({
        include: {
          product: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          order: { select: { order_number: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      result.stock_movements = stockMovements.map((m) => ({
        id: m.id,
        product_id: m.product_id,
        product_name: m.product.name,
        type: m.type,
        qty: Number(m.qty),
        stock_before: Number(m.stock_before),
        stock_after: Number(m.stock_after),
        notes: m.notes,
        created_by: m.user.name,
        order_number: m.order?.order_number ?? null,
        created_at: m.created_at.toISOString(),
      }));
    }

    return apiSuccess(result, "Audit data retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
