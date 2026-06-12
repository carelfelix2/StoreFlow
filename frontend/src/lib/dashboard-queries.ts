// =============================================================================
// Felix Snack POS — Dashboard Data Queries
// Shared query logic: used by both the API route handler and server component.
// All queries use real database data — no mock data.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

export interface DashboardData {
  kpis: {
    sales_today: number;
    orders_today: number;
    active_products: number;
    low_stock_products: number;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    grand_total: number;
    items_count: number;
    staff_name: string;
    payment_method: string | null;
    created_at: string;
  }>;
  staff_performance: Array<{
    id: string;
    name: string;
    role: string;
    order_count: number;
    total_sales: number;
  }>;
  sales_trend: Array<{
    date: string;
    total_sales: number;
    order_count: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_qty: number;
    total_sales: number;
  }>;
  low_stock_alerts: Array<{
    id: string;
    name: string;
    stock: number;
    min_stock: number;
    unit: string;
    category: string;
  }>;
  payment_breakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  meta: {
    generated_at: string;
    timezone: string;
  };
}

/**
 * Compute Jakarta calendar day boundaries.
 * Jakarta is UTC+7.
 */
function getJakartaDayRange() {
  const jakartaOffset = 7 * 60 * 60 * 1000;
  const now = new Date();
  const todayJakarta = new Date(
    Math.floor((now.getTime() + jakartaOffset) / 86400000) * 86400000 -
      jakartaOffset
  );
  const tomorrowJakarta = new Date(todayJakarta.getTime() + 86400000);
  const sevenDaysAgo = new Date(todayJakarta.getTime() - 6 * 86400000);
  return { todayJakarta, tomorrowJakarta, sevenDaysAgo };
}

export async function getDashboardData(): Promise<DashboardData> {
  const { todayJakarta, tomorrowJakarta, sevenDaysAgo } = getJakartaDayRange();

  const paidStatuses: OrderStatus[] = ["paid", "printed", "completed"];

  const [
    kpis,
    recentOrders,
    staffPerformance,
    salesTrend,
    topProducts,
    lowStockProducts,
    paymentBreakdown,
  ] = await Promise.all([
    // ---- KPIs ----
    (async () => {
      const [salesResult, ordersResult, activeProductsResult] =
        await Promise.all([
          prisma.order.aggregate({
            _sum: { grand_total: true },
            where: {
              status: { in: paidStatuses },
              paid_at: { gte: todayJakarta, lt: tomorrowJakarta },
            },
          }),
          prisma.order.count({
            where: {
              created_at: { gte: todayJakarta, lt: tomorrowJakarta },
            },
          }),
          prisma.product.count({
            where: { is_active: true },
          }),
        ]);

      const lowStockResult = await prisma.$queryRawUnsafe<
        Array<{ count: bigint }>
      >(
        `SELECT COUNT(*)::bigint as count FROM products WHERE is_active = true AND stock <= min_stock`
      );

      return {
        sales_today: Number(salesResult._sum?.grand_total ?? 0),
        orders_today: ordersResult,
        active_products: activeProductsResult,
        low_stock_products: Number(lowStockResult[0]?.count ?? 0),
      };
    })(),

    // ---- Recent Orders ----
    prisma.order.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        items: { orderBy: { created_at: "asc" } },
        staff: { select: { id: true, name: true } },
        payments: { where: { status: "paid" }, take: 1 },
      },
    }),

    // ---- Staff Performance ----
    prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        role: string;
        order_count: bigint;
        total_sales: string;
      }>
    >(
      `SELECT
        u.id, u.name, u.role::text,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status IN ('paid','printed','completed') THEN o.grand_total ELSE 0 END), 0)::text as total_sales
      FROM users u
      LEFT JOIN orders o ON o.created_by = u.id
        AND o.created_at >= $1::timestamptz
        AND o.created_at < $2::timestamptz
      WHERE u.role::text IN ('cashier', 'staff')
        AND u.is_active = true
      GROUP BY u.id, u.name, u.role
      ORDER BY order_count DESC`,
      todayJakarta,
      tomorrowJakarta
    ),

    // ---- Sales Trend (7 days, using generate_series) ----
    prisma.$queryRawUnsafe<
      Array<{ date: string; total_sales: string; order_count: bigint }>
    >(
      `SELECT
        d.date::text as date,
        COALESCE(SUM(o.grand_total), 0)::text as total_sales,
        COUNT(o.id) as order_count
      FROM generate_series(
        $1::date,
        $2::date,
        '1 day'::interval
      ) AS d(date)
      LEFT JOIN orders o ON o.paid_at::date = d.date::date
        AND o.status IN ('paid', 'printed', 'completed')
      GROUP BY d.date
      ORDER BY d.date`,
      sevenDaysAgo,
      todayJakarta
    ),

    // ---- Top Selling Products (7 days) ----
    prisma.$queryRawUnsafe<
      Array<{
        product_id: string;
        product_name: string;
        total_qty: string;
        total_sales: string;
      }>
    >(
      `SELECT
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(oi.base_qty), 0)::text as total_qty,
        COALESCE(SUM(oi.subtotal), 0)::text as total_sales
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'printed', 'completed')
        AND o.paid_at >= $1::timestamptz
        AND o.paid_at < $2::timestamptz
      GROUP BY p.id, p.name
      ORDER BY total_qty DESC
      LIMIT 5`,
      sevenDaysAgo,
      tomorrowJakarta
    ),

    // ---- Low Stock Products (fetch all, filter in JS) ----
    prisma.product.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        min_stock: true,
        base_unit: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
      take: 15,
    }),

    // ---- Payment Breakdown Today ----
    prisma.$queryRawUnsafe<
      Array<{
        method: string;
        payment_count: bigint;
        total_amount: string;
      }>
    >(
      `SELECT
        p.method::text,
        COUNT(*) as payment_count,
        COALESCE(SUM(p.amount), 0)::text as total_amount
      FROM payments p
      WHERE p.status = 'paid'
        AND p.paid_at >= $1::timestamptz
        AND p.paid_at < $2::timestamptz
      GROUP BY p.method`,
      todayJakarta,
      tomorrowJakarta
    ),
  ]);

  // Filter low-stock in JS (column comparison not possible in Prisma where)
  const filteredLowStock = lowStockProducts.filter(
    (p) => Number(p.stock) <= Number(p.min_stock)
  );

  return {
    kpis,
    recent_orders: recentOrders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      grand_total: Number(o.grand_total),
      items_count: o.items.length,
      staff_name: o.staff?.name ?? "Unknown",
      payment_method: o.payments[0]?.method ?? null,
      created_at: o.created_at.toISOString(),
    })),
    staff_performance: staffPerformance.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      order_count: Number(s.order_count),
      total_sales: Number(s.total_sales),
    })),
    sales_trend: salesTrend.map((d) => ({
      date: d.date,
      total_sales: Number(d.total_sales),
      order_count: Number(d.order_count),
    })),
    top_products: topProducts.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      total_qty: Number(p.total_qty),
      total_sales: Number(p.total_sales),
    })),
    low_stock_alerts: filteredLowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock),
      min_stock: Number(p.min_stock),
      unit: p.base_unit,
      category: p.category?.name ?? "-",
    })),
    payment_breakdown: paymentBreakdown.map((pb) => ({
      method: pb.method,
      count: Number(pb.payment_count),
      total: Number(pb.total_amount),
    })),
    meta: {
      generated_at: new Date().toISOString(),
      timezone: "Asia/Jakarta",
    },
  };
}
