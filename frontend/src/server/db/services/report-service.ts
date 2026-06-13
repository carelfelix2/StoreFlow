// =============================================================================
// Felix Snack POS — Report Service
// Business logic for report generation.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/client";
import type {
  SummaryReport,
  SalesReport,
  SalesReportItem,
  ProductReport,
  ProductReportItem,
  StockReport,
  StockReportItem,
  PaymentReport,
  PaymentReportItem,
} from "@/types/report";
import type {
  SummaryReportQuery,
  SalesReportQuery,
  ProductReportQuery,
  StockReportQuery,
  PaymentReportQuery,
} from "@/lib/validation/report";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJakartaDateRange(dateStr?: string, daysBack: number = 0) {
  const jakartaOffset = 7 * 60 * 60 * 1000;

  let start: Date;
  let end: Date;

  if (dateStr) {
    // Parse YYYY-MM-DD as Jakarta midnight
    const [y, m, d] = dateStr.split("-").map(Number);
    start = new Date(Date.UTC(y, m - 1, d) - jakartaOffset);
    end = new Date(start.getTime() + 86400000);
  } else {
    const now = new Date();
    const today = new Date(
      Math.floor((now.getTime() + jakartaOffset) / 86400000) * 86400000 -
        jakartaOffset
    );
    end = new Date(today.getTime() + 86400000);
    start = new Date(today.getTime() - daysBack * 86400000);
  }

  return { start, end };
}

function formatJakartaDate(d: Date): string {
  return new Date(d.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

const PAID_STATUSES: OrderStatus[] = ["paid", "printed", "completed"];

// ---------------------------------------------------------------------------
// Summary Report (KPI cards)
// ---------------------------------------------------------------------------

export async function getSummaryReport(
  query: SummaryReportQuery
): Promise<SummaryReport> {
  const { start, end } =
    query.start_date && query.end_date
      ? {
          start: getJakartaDateRange(query.start_date, 0).start,
          end: getJakartaDateRange(query.end_date, 0).end,
        }
      : getJakartaDateRange(undefined, 0);

  // Total sales (paid orders in range)
  const salesAgg = await prisma.order.aggregate({
    _sum: { grand_total: true },
    where: {
      status: { in: PAID_STATUSES },
      paid_at: { gte: start, lt: end },
    },
  });

  // Transaction count
  const txCount = await prisma.order.count({
    where: {
      status: { in: PAID_STATUSES },
      paid_at: { gte: start, lt: end },
    },
  });

  // Payment breakdown: cash vs QRIS
  const paymentBreakdown = await prisma.$queryRawUnsafe<
    Array<{ method: string; total: string; count: bigint }>
  >(
    `SELECT
      p.method::text,
      COALESCE(SUM(p.amount), 0)::text as total,
      COUNT(*) as count
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.status = 'paid'
      AND p.paid_at >= $1::timestamptz
      AND p.paid_at < $2::timestamptz
    GROUP BY p.method`,
    start,
    end
  );

  const cashTotal = Number(
    paymentBreakdown.find((p) => p.method === "cash")?.total ?? 0
  );
  const qrisTotal = Number(
    paymentBreakdown.find((p) => p.method === "qris")?.total ?? 0
  );

  // Gross profit: sum of (subtotal - cost_price * base_qty)
  const profitAgg = await prisma.$queryRawUnsafe<
    Array<{ gross_profit: string }>
  >(
    `SELECT
      COALESCE(SUM(oi.subtotal - (oi.cost_price * oi.base_qty)), 0)::text as gross_profit
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'printed', 'completed')
      AND o.paid_at >= $1::timestamptz
      AND o.paid_at < $2::timestamptz`,
    start,
    end
  );

  const totalSales = Number(salesAgg._sum?.grand_total ?? 0);
  const avgTxValue = txCount > 0 ? totalSales / txCount : 0;

  return {
    date: query.start_date
      ? `${query.start_date} - ${query.end_date || query.start_date}`
      : formatJakartaDate(start),
    total_sales: totalSales,
    transaction_count: txCount,
    cash_total: cashTotal,
    qris_total: qrisTotal,
    gross_profit: Number(profitAgg[0]?.gross_profit ?? 0),
    avg_transaction_value: avgTxValue,
  };
}

// ---------------------------------------------------------------------------
// Sales Report (detailed order list)
// ---------------------------------------------------------------------------

export async function getSalesReport(
  query: SalesReportQuery
): Promise<SalesReport> {
  const { start, end } =
    query.start_date && query.end_date
      ? {
          start: getJakartaDateRange(query.start_date, 0).start,
          end: getJakartaDateRange(query.end_date, 0).end,
        }
      : getJakartaDateRange(undefined, 0);

  const offset = (query.page - 1) * query.per_page;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      order_id: string;
      order_number: string;
      paid_at: string;
      cashier: string;
      customer_name: string | null;
      payment_method: string;
      total: string;
      status: string;
    }>
  >(
    `SELECT
      o.id as order_id,
      o.order_number,
      o.paid_at::text as paid_at,
      COALESCE(cashier.name, staff.name, '-') as cashier,
      o.customer_name,
      COALESCE(p.method::text, '-') as payment_method,
      o.grand_total::text as total,
      o.status::text
    FROM orders o
    LEFT JOIN users cashier ON cashier.id = o.cashier_id
    LEFT JOIN users staff ON staff.id = o.created_by
    LEFT JOIN LATERAL (
      SELECT p2.method, p2.amount
      FROM payments p2
      WHERE p2.order_id = o.id AND p2.status = 'paid'
      ORDER BY p2.created_at ASC
      LIMIT 1
    ) p ON true
    WHERE o.status IN ('paid', 'printed', 'completed')
      AND o.paid_at >= $1::timestamptz
      AND o.paid_at < $2::timestamptz
    ORDER BY o.paid_at DESC
    LIMIT $3 OFFSET $4`,
    start,
    end,
    query.per_page,
    offset
  );

  // Total for the period
  const agg = await prisma.order.aggregate({
    _sum: { grand_total: true },
    _count: { id: true },
    where: {
      status: { in: PAID_STATUSES },
      paid_at: { gte: start, lt: end },
    },
  });

  const items: SalesReportItem[] = rows.map((r) => ({
    order_id: r.order_id,
    order_number: r.order_number,
    date: r.paid_at,
    cashier: r.cashier,
    customer_name: r.customer_name,
    payment_method: r.payment_method,
    total: Number(r.total),
    status: r.status,
  }));

  return {
    data: items,
    start_date: query.start_date || formatJakartaDate(start),
    end_date: query.end_date || formatJakartaDate(new Date(end.getTime() - 1000)),
    total_sales: Number(agg._sum?.grand_total ?? 0),
    transaction_count: agg._count.id,
  };
}

// ---------------------------------------------------------------------------
// Product Report (Top Selling)
// ---------------------------------------------------------------------------

export async function getProductReport(
  query: ProductReportQuery
): Promise<ProductReport> {
  const { start, end } =
    query.start_date && query.end_date
      ? {
          start: getJakartaDateRange(query.start_date, 0).start,
          end: getJakartaDateRange(query.end_date, 0).end,
        }
      : getJakartaDateRange(undefined, 6);

  const useStart = query.start_date ? start : getJakartaDateRange(undefined, 6).start;
  const useEnd = query.end_date ? end : getJakartaDateRange(undefined, 0).end;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      product_id: string;
      product_name: string;
      total_qty: string;
      total_sales: string;
      total_cost: string;
    }>
  >(
    `SELECT
      p.id as product_id,
      p.name as product_name,
      COALESCE(SUM(oi.base_qty), 0)::text as total_qty,
      COALESCE(SUM(oi.subtotal), 0)::text as total_sales,
      COALESCE(SUM(oi.cost_price * oi.base_qty), 0)::text as total_cost
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'printed', 'completed')
      AND o.paid_at >= $1::timestamptz
      AND o.paid_at < $2::timestamptz
    GROUP BY p.id, p.name
    ORDER BY total_qty DESC
    LIMIT $3`,
    useStart,
    useEnd,
    query.limit
  );

  const items: ProductReportItem[] = rows.map((r) => ({
    product_id: r.product_id,
    product_name: r.product_name,
    total_qty: Number(r.total_qty),
    total_sales: Number(r.total_sales),
    total_cost: Number(r.total_cost),
    gross_profit: Number(r.total_sales) - Number(r.total_cost),
  }));

  const totalSales = items.reduce((sum, i) => sum + i.total_sales, 0);
  const totalProfit = items.reduce((sum, i) => sum + i.gross_profit, 0);

  return {
    data: items,
    start_date: formatJakartaDate(useStart),
    end_date: formatJakartaDate(new Date(useEnd.getTime() - 1000)),
    total_sales: totalSales,
    total_profit: totalProfit,
  };
}

// ---------------------------------------------------------------------------
// Stock Report
// ---------------------------------------------------------------------------

export async function getStockReport(query: StockReportQuery): Promise<StockReport> {
  const { search, low_stock_only, page, per_page } = query;

  const whereConditions: string[] = ["p.is_active = true"];
  const params: Array<string | number> = [];

  if (search) {
    whereConditions.push(
      `(p.name ILIKE $${params.length + 1} OR p.sku ILIKE $${params.length + 1})`
    );
    params.push(`%${search}%`);
  }

  if (low_stock_only) {
    whereConditions.push("p.stock <= p.min_stock");
  }

  const whereClause = whereConditions.length
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";

  const offset = (page - 1) * per_page;

  const countParam = params.length + 1;
  const limitParam = countParam + 1;
  const offsetParam = limitParam + 1;

  const data = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      sku: string | null;
      stock: string;
      min_stock: string;
      base_unit: string;
      category: string;
      cost_price: string;
      selling_price: string;
    }>
  >(
    `SELECT
      p.id,
      p.name,
      p.sku,
      p.stock::text,
      p.min_stock::text,
      p.base_unit,
      COALESCE(c.name, '-') as category,
      p.cost_price::text,
      p.selling_price::text
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY p.stock ASC, p.name ASC
    LIMIT $${limitParam} OFFSET $${offsetParam}`,
    ...params,
    per_page,
    offset
  );

  const countResult = await prisma.$queryRawUnsafe<
    Array<{ count: bigint }>
  >(
    `SELECT COUNT(*)::bigint as count FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereClause}`,
    ...params
  );

  const total = Number(countResult[0]?.count ?? 0);

  const items: StockReportItem[] = data.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    stock: Number(r.stock),
    min_stock: Number(r.min_stock),
    base_unit: r.base_unit,
    category: r.category,
    cost_price: Number(r.cost_price),
    selling_price: Number(r.selling_price),
    stock_value: Number(r.stock) * Number(r.cost_price),
  }));

  return { data: items, total, page, per_page };
}

// ---------------------------------------------------------------------------
// Payment Report
// ---------------------------------------------------------------------------

export async function getPaymentReport(
  query: PaymentReportQuery
): Promise<PaymentReport> {
  const { start, end } =
    query.start_date && query.end_date
      ? {
          start: getJakartaDateRange(query.start_date, 0).start,
          end: getJakartaDateRange(query.end_date, 0).end,
        }
      : getJakartaDateRange(undefined, 6);

  const useStart = query.start_date ? start : getJakartaDateRange(undefined, 6).start;
  const useEnd = query.end_date ? end : getJakartaDateRange(undefined, 0).end;

  const rows = await prisma.$queryRawUnsafe<
    Array<{ method: string; count: bigint; total: string }>
  >(
    `SELECT
      p.method::text,
      COUNT(*) as count,
      COALESCE(SUM(p.amount), 0)::text as total
    FROM payments p
    WHERE p.status = 'paid'
      AND p.paid_at >= $1::timestamptz
      AND p.paid_at < $2::timestamptz
    GROUP BY p.method
    ORDER BY total DESC`,
    useStart,
    useEnd
  );

  const items: PaymentReportItem[] = rows.map((r) => ({
    method: r.method,
    count: Number(r.count),
    total: Number(r.total),
  }));

  const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

  return {
    data: items,
    start_date: formatJakartaDate(useStart),
    end_date: formatJakartaDate(new Date(useEnd.getTime() - 1000)),
    total_amount: totalAmount,
  };
}
