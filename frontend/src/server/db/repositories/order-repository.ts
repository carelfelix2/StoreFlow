// =============================================================================
// Felix Snack POS — Order Repository
// Data access layer for orders. All Prisma queries for orders,
// order items, and order logs flow through this repository.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus, OrderLogAction, PaymentMethod, PaymentStatus, StockMovementType } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderWithRelations {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  created_by: string;
  cashier_id: string | null;
  status: string;
  subtotal: Prisma.Decimal;
  discount_total: Prisma.Decimal;
  tax_total: Prisma.Decimal;
  grand_total: Prisma.Decimal;
  notes: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  paid_at: Date | null;
  printed_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    unit_name: string;
    qty: Prisma.Decimal;
    conversion_to_base: Prisma.Decimal;
    base_qty: Prisma.Decimal;
    price: Prisma.Decimal;
    cost_price: Prisma.Decimal;
    subtotal: Prisma.Decimal;
    created_at: Date;
    updated_at: Date;
  }>;
  logs?: Array<{
    id: string;
    order_id: string;
    user_id: string | null;
    action: string;
    old_value: Prisma.JsonValue | null;
    new_value: Prisma.JsonValue | null;
    created_at: Date;
  }>;
}

export interface CreateOrderItemData {
  product_id: string;
  product_name: string;
  unit_name: string;
  qty: Prisma.Decimal | number;
  conversion_to_base: Prisma.Decimal | number;
  base_qty: Prisma.Decimal | number;
  price: Prisma.Decimal | number;
  cost_price: Prisma.Decimal | number;
  subtotal: Prisma.Decimal | number;
}

// ---------------------------------------------------------------------------
// Query Helpers
// ---------------------------------------------------------------------------

const orderInclude = {
  items: {
    orderBy: { created_at: "asc" as const },
  },
  logs: {
    orderBy: { created_at: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List orders with optional status filter and pagination.
 * Orders are sorted newest-first by default.
 */
export async function listOrders(
  filters: {
    status?: string[];
    page?: number;
    per_page?: number;
  } = {}
) {
  const { status, page = 1, per_page = 20 } = filters;

  const where: Prisma.OrderWhereInput = {};

  if (status && status.length > 0) {
    where.status = { in: status as OrderStatus[] };
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * per_page,
      take: per_page,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, page, per_page };
}

/**
 * Find an order by its ID with items and logs.
 */
export async function findById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
}

/**
 * Find an order by its order number.
 */
export async function findByOrderNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { order_number: orderNumber },
    include: orderInclude,
  });
}

/**
 * Generate a unique order number in the format ORD-YYYYMMDD-XXXX.
 * The XXXX portion is a zero-padded sequential number that resets daily.
 */
export async function generateOrderNumber(
  tx?: Prisma.TransactionClient
): Promise<string> {
  const client = tx ?? prisma;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `ORD-${dateStr}-`;

  // Find the highest order number with today's prefix
  const lastOrder = await client.order.findFirst({
    where: {
      order_number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      order_number: "desc",
    },
    select: {
      order_number: true,
    },
  });

  let nextSeq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.order_number.slice(-4), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

/**
 * Create an order with its items in a single transaction.
 */
export async function createOrderWithItems(
  data: {
    order_number: string;
    customer_id?: string | null;
    customer_name?: string | null;
    created_by: string;
    status?: string;
    subtotal: Prisma.Decimal | number;
    discount_total?: Prisma.Decimal | number;
    tax_total?: Prisma.Decimal | number;
    grand_total: Prisma.Decimal | number;
    notes?: string | null;
    submitted_at?: Date | null;
  },
  items: CreateOrderItemData[],
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  const execute = async (transactionClient: Prisma.TransactionClient) => {
    const order = await transactionClient.order.create({
      data: {
        order_number: data.order_number,
        customer_id: data.customer_id ?? null,
        customer_name: data.customer_name ?? null,
        created_by: data.created_by,
        status: (data.status ?? "submitted") as OrderStatus,
        subtotal: data.subtotal,
        discount_total: data.discount_total ?? 0,
        tax_total: data.tax_total ?? 0,
        grand_total: data.grand_total,
        notes: data.notes ?? null,
        submitted_at: data.submitted_at ?? new Date(),
        items: {
          create: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            unit_name: item.unit_name,
            qty: item.qty,
            conversion_to_base: item.conversion_to_base,
            base_qty: item.base_qty,
            price: item.price,
            cost_price: item.cost_price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: orderInclude,
    });

    return order;
  };

  if (tx) {
    return execute(tx);
  }

  return prisma.$transaction(execute);
}

/**
 * Create an order log entry for audit trail.
 */
export async function createOrderLog(
  data: {
    order_id: string;
    user_id?: string | null;
    action: string;
    old_value?: Record<string, unknown> | null;
    new_value?: Record<string, unknown> | null;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  return client.orderLog.create({
    data: {
      order_id: data.order_id,
      user_id: data.user_id ?? null,
      action: data.action as OrderLogAction,
      old_value: data.old_value !== null && data.old_value !== undefined
        ? JSON.parse(JSON.stringify(data.old_value))
        : undefined,
      new_value: data.new_value !== null && data.new_value !== undefined
        ? JSON.parse(JSON.stringify(data.new_value))
        : undefined,
    },
  });
}

/**
 * Update order status.
 */
export async function updateStatus(
  id: string,
  status: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  const updateData: Prisma.OrderUncheckedUpdateInput = {
    status: status as OrderStatus,
  };

  // Set timestamp fields based on status
  switch (status) {
    case "submitted":
      updateData.submitted_at = new Date();
      break;
    case "approved":
      updateData.approved_at = new Date();
      break;
    case "paid":
      updateData.paid_at = new Date();
      break;
    case "printed":
      updateData.printed_at = new Date();
      break;
    case "completed":
      updateData.completed_at = new Date();
      break;
    case "cancelled":
      updateData.cancelled_at = new Date();
      break;
  }

  return client.order.update({
    where: { id },
    data: updateData,
    include: orderInclude,
  });
}

// ---------------------------------------------------------------------------
// Payment & Stock Movement Functions (Phase 5B)
// ---------------------------------------------------------------------------

/**
 * Find an order by ID with items, including product stock info for payment processing.
 * This fetches the current product stock levels alongside order items.
 */
export async function findOrderWithItemsAndProducts(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { created_at: "asc" },
      },
      logs: {
        orderBy: { created_at: "asc" },
      },
      payments: {
        where: { status: "paid" as PaymentStatus },
        take: 1,
      },
    },
  });
}

/**
 * Create a payment record for an order.
 */
export async function createPayment(
  data: {
    order_id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: Prisma.Decimal | number;
    paid_amount: Prisma.Decimal | number;
    change_amount: Prisma.Decimal | number;
    paid_at: Date;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  return client.payment.create({
    data: {
      order_id: data.order_id,
      method: data.method,
      status: data.status,
      amount: data.amount,
      paid_amount: data.paid_amount,
      change_amount: data.change_amount,
      paid_at: data.paid_at,
    },
  });
}

/**
 * Create a stock movement record.
 */
export async function createStockMovement(
  data: {
    product_id: string;
    order_id: string;
    type: StockMovementType;
    qty: Prisma.Decimal | number;
    unit_name?: string | null;
    unit_qty?: Prisma.Decimal | number | null;
    stock_before: Prisma.Decimal | number;
    stock_after: Prisma.Decimal | number;
    notes?: string | null;
    created_by: string;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  return client.stockMovement.create({
    data: {
      product_id: data.product_id,
      order_id: data.order_id,
      type: data.type,
      qty: data.qty,
      unit_name: data.unit_name ?? null,
      unit_qty: data.unit_qty ?? null,
      stock_before: data.stock_before,
      stock_after: data.stock_after,
      notes: data.notes ?? null,
      created_by: data.created_by,
    },
  });
}

/**
 * Update order cashier_id and status in a single operation.
 * Used during payment processing to record which cashier processed the payment.
 */
export async function updateOrderCashierAndStatus(
  id: string,
  cashierId: string,
  status: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  const updateData: Prisma.OrderUncheckedUpdateInput = {
    cashier_id: cashierId,
    status: status as OrderStatus,
    paid_at: new Date(),
  };

  return client.order.update({
    where: { id },
    data: updateData,
    include: orderInclude,
  });
}

// ---------------------------------------------------------------------------
// Phase 6: Receipt & Print Functions
// ---------------------------------------------------------------------------

/**
 * Find an order by ID with payments, cashier info, and store settings for receipt.
 * Used by the receipt preview API.
 */
export async function findOrderWithPayments(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { created_at: "asc" },
      },
      payments: {
        where: { status: "paid" as PaymentStatus },
        take: 1,
      },
      cashier: {
        select: {
          id: true,
          name: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get store settings for receipt display.
 */
export async function getStoreSettings() {
  return prisma.storeSetting.findFirst({
    orderBy: { created_at: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Phase 7A: QRIS Payment Functions
// ---------------------------------------------------------------------------

/**
 * Create a pending QRIS payment record.
 */
export async function createPendingPayment(
  data: {
    order_id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: Prisma.Decimal | number;
    gateway: string;
    gateway_reference: string;
    qris_url?: string | null;
    expired_at: Date;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  return client.payment.create({
    data: {
      order_id: data.order_id,
      method: data.method,
      status: data.status,
      amount: data.amount,
      paid_amount: 0,
      change_amount: 0,
      gateway: data.gateway,
      gateway_reference: data.gateway_reference,
      qris_url: data.qris_url ?? null,
      expired_at: data.expired_at,
    },
  });
}

/**
 * Find a pending payment by its ID with order relation.
 */
export async function findPendingPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            orderBy: { created_at: "asc" },
          },
        },
      },
    },
  });
}

/**
 * Find a pending payment by gateway reference with order relation.
 */
export async function findPendingPaymentByReference(gatewayReference: string) {
  return prisma.payment.findUnique({
    where: { gateway_reference: gatewayReference },
    include: {
      order: {
        include: {
          items: {
            orderBy: { created_at: "asc" },
          },
        },
      },
    },
  });
}

/**
 * Confirm a payment as paid and update order status in a transaction.
 * This handles the full payment confirmation: payment status, order status,
 * stock reduction, stock movements, payment log, and order log.
 */
export async function confirmPaymentPaid(
  paymentId: string,
  orderId: string,
  userId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  // Update payment to paid
  await client.payment.update({
    where: { id: paymentId },
    data: {
      status: "paid" as PaymentStatus,
      paid_at: new Date(),
    },
  });

  // Update order status to paid and set cashier_id
  const updatedOrder = await client.order.update({
    where: { id: orderId },
    data: {
      status: "paid" as OrderStatus,
      cashier_id: userId,
      paid_at: new Date(),
    },
    include: orderInclude,
  });

  return updatedOrder;
}

/**
 * Create a payment log entry.
 */
export async function createPaymentLog(
  data: {
    payment_id: string;
    created_by: string | null;
    event: string;
    payload?: Prisma.InputJsonValue | null;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;

  return client.paymentLog.create({
    data: {
      payment_id: data.payment_id,
      created_by: data.created_by,
      event: data.event,
      payload: (data.payload ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
