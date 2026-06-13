// =============================================================================
// Felix Snack POS — Order Service
// Business logic layer for order operations.
// Services orchestrate repositories and enforce business rules.
// =============================================================================

import * as orderRepository from "@/server/db/repositories/order-repository";
import * as productRepository from "@/server/db/repositories/product-repository";
import type { CreateOrderInput } from "@/lib/validation/order";
import { AuthError } from "@/lib/auth-helpers";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CashPaymentInput } from "@/lib/validation/order-status";
import { getActivePaymentProvider } from "@/server/payments";
import type { CreateQrisPaymentResponse } from "@/server/payments";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  unit_name: string;
  qty: number;
  conversion_to_base: number;
  base_qty: number;
  price: number;
  cost_price: number;
  subtotal: number;
}

export interface OrderLogResponse {
  id: string;
  user_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: Date;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  created_by: string;
  cashier_id: string | null;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  notes: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  paid_at: Date | null;
  printed_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  items: OrderItemResponse[];
  logs?: OrderLogResponse[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toItemResponse(
  item: orderRepository.OrderWithRelations["items"][number]
): OrderItemResponse {
  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    unit_name: item.unit_name,
    qty: Number(item.qty),
    conversion_to_base: Number(item.conversion_to_base),
    base_qty: Number(item.base_qty),
    price: Number(item.price),
    cost_price: Number(item.cost_price),
    subtotal: Number(item.subtotal),
  };
}

function toLogResponse(
  log: NonNullable<orderRepository.OrderWithRelations["logs"]>[number]
): OrderLogResponse {
  return {
    id: log.id,
    user_id: log.user_id,
    action: log.action,
    old_value: log.old_value as Record<string, unknown> | null,
    new_value: log.new_value as Record<string, unknown> | null,
    created_at: log.created_at,
  };
}

function toResponse(
  order: orderRepository.OrderWithRelations
): OrderResponse {
  return {
    id: order.id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    created_by: order.created_by,
    cashier_id: order.cashier_id,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    tax_total: Number(order.tax_total),
    grand_total: Number(order.grand_total),
    notes: order.notes,
    submitted_at: order.submitted_at,
    approved_at: order.approved_at,
    paid_at: order.paid_at,
    printed_at: order.printed_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: order.items.map(toItemResponse),
    logs: order.logs?.map(toLogResponse),
  };
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a product exists, is active, and has sufficient stock.
 * Returns the product with its units.
 */
async function validateProduct(productId: string) {
  const product = await productRepository.findById(productId);

  if (!product) {
    throw new AuthError("Product not found", 404);
  }

  if (!product.is_active) {
    throw new AuthError("Product is inactive and cannot be ordered", 400);
  }

  return product;
}

/**
 * Validate that a unit exists for the given product and return it.
 */
function validateUnit(
  product: productRepository.ProductWithRelations,
  unitName: string
) {
  const unit = product.units.find((u) => u.unit_name === unitName);

  if (!unit) {
    throw new AuthError(
      `Unit "${unitName}" is not available for product "${product.name}"`,
      400
    );
  }

  return unit;
}

/**
 * Validate that the requested quantity does not exceed available stock.
 * base_qty = qty * conversion_to_base
 */
function validateStock(
  product: productRepository.ProductWithRelations,
  unit: productRepository.ProductWithRelations["units"][number],
  qty: number
) {
  const baseQty = new Prisma.Decimal(qty).mul(unit.conversion_to_base);

  if (baseQty.gt(product.stock)) {
    throw new AuthError(
      `Insufficient stock for "${product.name}". Available: ${Number(product.stock)} ${product.base_unit}, requested: ${Number(baseQty)} ${product.base_unit}`,
      400
    );
  }

  return baseQty;
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * List orders with optional status filter and pagination.
 * Returns a paginated response with items and logs included.
 */
export async function listOrders(
  filters: {
    status?: string[];
    page?: number;
    per_page?: number;
    created_by?: string;
  } = {}
) {
  const result = await orderRepository.listOrders(filters);

  return {
    data: result.data.map(toResponse),
    total: result.total,
    page: result.page,
    per_page: result.per_page,
  };
}

/**
 * Transition an order from submitted to reviewing.
 * Only cashier/owner can perform this action.
 */
export async function reviewOrder(
  orderId: string,
  userId: string
): Promise<OrderResponse> {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  if (order.status !== "submitted") {
    throw new AuthError(
      `Cannot review order in "${order.status}" status. Only submitted orders can be reviewed.`,
      400
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await orderRepository.updateStatus(orderId, "reviewing", tx);

    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "STATUS_CHANGED",
        old_value: { status: "submitted" },
        new_value: { status: "reviewing" },
      },
      tx
    );

    return updated;
  });

  return toResponse(result);
}

/**
 * Transition an order from reviewing to approved.
 * Only cashier/owner can perform this action.
 */
export async function approveOrder(
  orderId: string,
  userId: string
): Promise<OrderResponse> {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  if (order.status !== "reviewing") {
    throw new AuthError(
      `Cannot approve order in "${order.status}" status. Only reviewing orders can be approved.`,
      400
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await orderRepository.updateStatus(orderId, "approved", tx);

    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "STATUS_CHANGED",
        old_value: { status: "reviewing" },
        new_value: { status: "approved" },
      },
      tx
    );

    return updated;
  });

  return toResponse(result);
}

/**
 * Cancel an order. Only cashier/owner can perform this action.
 * Allowed from: submitted, reviewing
 */
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<OrderResponse> {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  const cancellableStatuses = ["submitted", "reviewing"];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AuthError(
      `Cannot cancel order in "${order.status}" status. Only submitted or reviewing orders can be cancelled.`,
      400
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await orderRepository.updateStatus(orderId, "cancelled", tx);

    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "ORDER_CANCELLED",
        old_value: { status: order.status },
        new_value: { status: "cancelled" },
      },
      tx
    );

    return updated;
  });

  return toResponse(result);
}

/**
 * Void an order. Only owner can perform this action.
 * Allowed from: paid, printed, completed
 * This reverses the order status to voided without reversing payments or stock.
 */
export async function voidOrder(
  orderId: string,
  userId: string
): Promise<OrderResponse> {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  const voidableStatuses = ["paid", "printed", "completed"];
  if (!voidableStatuses.includes(order.status)) {
    throw new AuthError(
      `Cannot void order in "${order.status}" status. Only paid, printed, or completed orders can be voided.`,
      400
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await orderRepository.updateStatus(orderId, "voided", tx);

    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "ORDER_VOIDED",
        old_value: { status: order.status },
        new_value: { status: "voided" },
      },
      tx
    );

    return updated;
  });

  return toResponse(result);
}

/**
 * Create a new order from the staff cart.
 *
 * Business rules:
 * 1. Validate all products exist and are active
 * 2. Validate all units exist for their products
 * 3. Validate stock availability (but do NOT reduce stock yet)
 * 4. Recalculate all prices from the database (never trust frontend prices)
 * 5. Generate order number
 * 6. Create order with items in a transaction
 * 7. Create order log for STATUS_CHANGED -> submitted
 * 8. Return the created order
 */
export async function createOrderFromCart(
  input: CreateOrderInput,
  userId: string
): Promise<OrderResponse> {
  // Validate items
  if (!input.items || input.items.length === 0) {
    throw new AuthError("Order must have at least 1 item", 400);
  }

  // Process all items: validate products, units, stock, and calculate prices
  const validatedItems: Array<{
    product_id: string;
    product_name: string;
    unit_name: string;
    qty: Prisma.Decimal;
    conversion_to_base: Prisma.Decimal;
    base_qty: Prisma.Decimal;
    price: Prisma.Decimal;
    cost_price: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }> = [];

  for (const item of input.items) {
    // Validate product
    const product = await validateProduct(item.product_id);

    // Validate unit
    const unit = validateUnit(product, item.unit_name);

    // Validate stock
    const qty = new Prisma.Decimal(item.qty);
    const baseQty = validateStock(product, unit, item.qty);

    // Use the unit's selling price (or product's selling price if unit is default)
    const price = unit.selling_price;
    const costPrice = product.cost_price;

    // Calculate subtotal: qty * price (in selected unit)
    const subtotal = qty.mul(price);

    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_name: unit.unit_name,
      qty,
      conversion_to_base: unit.conversion_to_base,
      base_qty: baseQty,
      price,
      cost_price: costPrice,
      subtotal,
    });
  }

  // Calculate order totals
  const subtotal = validatedItems.reduce(
    (sum, item) => sum.add(item.subtotal),
    new Prisma.Decimal(0)
  );
  const discountTotal = new Prisma.Decimal(0);
  const taxTotal = new Prisma.Decimal(0);
  const grandTotal = subtotal.add(discountTotal).add(taxTotal);

  // Execute everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Generate order number inside the transaction to avoid race conditions
    const orderNumber = await orderRepository.generateOrderNumber(tx);

    // Create order with items
    const order = await orderRepository.createOrderWithItems(
      {
        order_number: orderNumber,
        created_by: userId,
        status: "submitted",
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        customer_name: input.customer_name || null,
        notes: input.notes || null,
        submitted_at: new Date(),
      },
      validatedItems.map((item) => ({
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
      tx
    );

    // Create order log for status change
    await orderRepository.createOrderLog(
      {
        order_id: order.id,
        user_id: userId,
        action: "STATUS_CHANGED",
        old_value: null,
        new_value: { status: "submitted" },
      },
      tx
    );

    return order;
  });

  return toResponse(result);
}

/**
 * Get an order by its ID with all items and logs.
 */
export async function getOrderById(id: string): Promise<OrderResponse> {
  const order = await orderRepository.findById(id);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  return toResponse(order);
}

// ---------------------------------------------------------------------------
// Phase 5B: Cash Payment
// ---------------------------------------------------------------------------

/**
 * Process a cash payment for an approved order.
 *
 * Business rules:
 * 1. Only cashier/owner can process payment
 * 2. Order must be status "approved"
 * 3. paid_amount must be >= order.grand_total
 * 4. change_amount = paid_amount - grand_total
 * 5. Create Payment record: method=cash, status=paid, amount=grand_total, paid_amount, change_amount, paid_at=now
 * 6. Update Order: status=paid, paid_at=now, cashier_id=current user
 * 7. Reduce product stock for each item: stock = stock - base_qty
 * 8. Create StockMovement for each item: type=sale, qty=negative base_qty, stock_before, stock_after, order_id, unit_name, unit_qty, created_by
 * 9. Create OrderLog: action=PAYMENT_PAID, old_value={status:"approved"}, new_value={status:"paid", payment_method:"cash"}
 * 10. Entire process inside Prisma $transaction
 * 11. If stock insufficient at payment time, fail safely
 * 12. Do not allow duplicate payment for same order
 */
export async function processCashPayment(
  orderId: string,
  userId: string,
  input: CashPaymentInput
): Promise<OrderResponse> {
  // Fetch order with items and existing payments
  const order = await orderRepository.findOrderWithItemsAndProducts(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  // Rule 2: Order must be approved
  if (order.status !== "approved") {
    throw new AuthError(
      `Cannot process payment for order in "${order.status}" status. Only approved orders can be paid.`,
      400
    );
  }

  // Rule 12: No duplicate payment
  if (order.payments && order.payments.length > 0) {
    throw new AuthError(
      "This order has already been paid. Duplicate payment is not allowed.",
      400
    );
  }

  // Rule 3: paid_amount >= grand_total
  const grandTotal = Number(order.grand_total);
  if (input.paid_amount < grandTotal) {
    throw new AuthError(
      `Insufficient payment amount. Required: ${grandTotal}, received: ${input.paid_amount}`,
      400
    );
  }

  // Rule 4: Calculate change
  const changeAmount = input.paid_amount - grandTotal;

  // Execute everything in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // Rule 7 & 8: Reduce stock and create StockMovement for each item
    for (const item of order.items) {
      const baseQty = Number(item.base_qty);

      // Fetch current product stock inside transaction
      const product = await tx.product.findUnique({
        where: { id: item.product_id },
        select: { id: true, stock: true, name: true },
      });

      if (!product) {
        throw new AuthError(
          `Product "${item.product_name}" not found in inventory`,
          404
        );
      }

      // Rule 11: Check stock sufficiency at payment time
      const currentStock = Number(product.stock);
      if (currentStock < baseQty) {
        throw new AuthError(
          `Insufficient stock for "${item.product_name}". Available: ${currentStock}, required: ${baseQty}`,
          400
        );
      }

      // Calculate new stock after deduction
      const newStock = new Prisma.Decimal(currentStock).sub(
        new Prisma.Decimal(baseQty)
      );

      // Update product stock
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: newStock },
      });

      // Create StockMovement record
      await orderRepository.createStockMovement(
        {
          product_id: item.product_id,
          order_id: orderId,
          type: "sale" as const,
          qty: new Prisma.Decimal(baseQty).negated(), // negative qty for sale
          unit_name: item.unit_name,
          unit_qty: item.qty,
          stock_before: new Prisma.Decimal(currentStock),
          stock_after: newStock,
          created_by: userId,
        },
        tx
      );
    }

    // Rule 5: Create Payment record
    await orderRepository.createPayment(
      {
        order_id: orderId,
        method: "cash" as const,
        status: "paid" as const,
        amount: new Prisma.Decimal(grandTotal),
        paid_amount: new Prisma.Decimal(input.paid_amount),
        change_amount: new Prisma.Decimal(changeAmount),
        paid_at: new Date(),
      },
      tx
    );

    // Rule 6: Update order status to paid and set cashier_id
    const updated = await orderRepository.updateOrderCashierAndStatus(
      orderId,
      userId,
      "paid",
      tx
    );

    // Rule 9: Create OrderLog
    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "PAYMENT_PAID",
        old_value: { status: "approved" },
        new_value: { status: "paid", payment_method: "cash" },
      },
      tx
    );

    return updated;
  });

  return toResponse(result);
}

// ---------------------------------------------------------------------------
// Phase 6: Receipt & Print
// ---------------------------------------------------------------------------

/**
 * Receipt item response type.
 */
export interface ReceiptItemResponse {
  id: string;
  product_name: string;
  unit_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

/**
 * Payment info for receipt.
 */
export interface ReceiptPaymentResponse {
  method: string;
  amount: number;
  paid_amount: number;
  change_amount: number;
  paid_at: Date | null;
}

/**
 * Receipt data response type.
 */
export interface ReceiptResponse {
  store_name: string;
  store_address: string | null;
  store_phone: string | null;
  receipt_footer: string | null;
  order_number: string;
  order_id: string;
  created_at: Date;
  paid_at: Date | null;
  cashier_name: string | null;
  staff_name: string | null;
  customer_name: string | null;
  items: ReceiptItemResponse[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  payment: ReceiptPaymentResponse | null;
  is_printed: boolean;
  printed_at: Date | null;
}

/**
 * Get receipt data for a paid order.
 *
 * Business rules:
 * 1. Only owner/cashier can access receipt
 * 2. Receipt only available for paid or printed orders
 * 3. Printing does not change stock
 * 4. If already printed, is_printed = true
 */
export async function getReceiptData(
  orderId: string
): Promise<ReceiptResponse> {
  const order = await orderRepository.findOrderWithPayments(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  // Rule 2: Only paid or printed orders
  if (order.status !== "paid" && order.status !== "printed") {
    throw new AuthError(
      `Receipt is not available for order in "${order.status}" status. Only paid orders can print receipt.`,
      400
    );
  }

  // Get store settings
  const storeSettings = await orderRepository.getStoreSettings();

  // Get payment info
  const payment = order.payments && order.payments.length > 0
    ? {
        method: order.payments[0].method,
        amount: Number(order.payments[0].amount),
        paid_amount: Number(order.payments[0].paid_amount),
        change_amount: Number(order.payments[0].change_amount),
        paid_at: order.payments[0].paid_at,
      }
    : null;

  return {
    store_name: storeSettings?.store_name ?? "Felix Snack",
    store_address: storeSettings?.address ?? null,
    store_phone: storeSettings?.phone ?? null,
    receipt_footer: storeSettings?.receipt_footer ?? null,
    order_number: order.order_number,
    order_id: order.id,
    created_at: order.created_at,
    paid_at: order.paid_at,
    cashier_name: order.cashier?.name ?? null,
    staff_name: order.staff?.name ?? null,
    customer_name: order.customer_name ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      product_name: item.product_name,
      unit_name: item.unit_name,
      qty: Number(item.qty),
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    })),
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    tax_total: Number(order.tax_total),
    grand_total: Number(order.grand_total),
    payment,
    is_printed: order.status === "printed",
    printed_at: order.printed_at ?? null,
  };
}

/**
 * Mark an order as printed.
 *
 * Business rules:
 * 1. Only owner/cashier can mark as printed
 * 2. Order must be in "paid" status
 * 3. Creates OrderLog with PRINTED action
 * 4. Reprint is allowed (idempotent — if already printed, just return success)
 */
export async function markAsPrinted(
  orderId: string,
  userId: string
): Promise<ReceiptResponse> {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  // Only allow marking as printed from "paid" status
  // If already printed, it's a reprint — still return success
  if (order.status !== "paid" && order.status !== "printed") {
    throw new AuthError(
      `Cannot mark order in "${order.status}" status as printed. Only paid orders can be printed.`,
      400
    );
  }

  // If already printed, just return receipt data (reprint)
  if (order.status === "printed") {
    return getReceiptData(orderId);
  }

  // Execute in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updated = await orderRepository.updateStatus(orderId, "printed", tx);

    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "PRINTED",
        old_value: { status: "paid" },
        new_value: { status: "printed" },
      },
      tx
    );

    return updated;
  });

  // Return receipt data after marking as printed
  return getReceiptData(orderId);
}

// ---------------------------------------------------------------------------
// Phase 7A: QRIS Payment
// ---------------------------------------------------------------------------

/**
 * Response type for initiating a QRIS payment.
 */
export interface QrisPaymentResponse {
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  gateway: string;
  gateway_reference: string;
  qris_url: string | null;
  qris_payload: string | null;
  expired_at: Date;
  status: string;
}

/**
 * Initiate a QRIS payment for an approved order.
 *
 * Business Rules:
 * 1. Only owner/cashier can start QRIS payment.
 * 2. Order must be approved.
 * 3. No duplicate paid payment.
 * 4. Create Payment record with pending status.
 * 5. Order status becomes waiting_payment.
 * 6. Create OrderLog PAYMENT_STARTED.
 */
export async function initiateQrisPayment(
  orderId: string,
  userId: string
): Promise<QrisPaymentResponse> {
  // Fetch order with items and existing payments
  const order = await orderRepository.findOrderWithItemsAndProducts(orderId);

  if (!order) {
    throw new AuthError("Order not found", 404);
  }

  // Rule 2: Order must be approved
  if (order.status !== "approved") {
    throw new AuthError(
      `Cannot initiate QRIS payment for order in "${order.status}" status. Only approved orders can be paid.`,
      400
    );
  }

  // Rule 3: No duplicate paid payment
  if (order.payments && order.payments.length > 0) {
    throw new AuthError(
      "This order has already been paid. Duplicate payment is not allowed.",
      400
    );
  }

  const grandTotal = Number(order.grand_total);

  // Get the active payment provider
  const provider = getActivePaymentProvider();

  // Call provider to create QRIS payment
  const providerResponse: CreateQrisPaymentResponse =
    await provider.createQrisPayment({
      order_id: orderId,
      order_number: order.order_number,
      amount: grandTotal,
      customer_name: order.customer_name,
      expiry_minutes: 15,
    });

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Rule 4: Create Payment record with pending status
    const payment = await orderRepository.createPendingPayment(
      {
        order_id: orderId,
        method: "qris" as const,
        status: "pending" as const,
        amount: new Prisma.Decimal(grandTotal),
        gateway: providerResponse.gateway,
        gateway_reference: providerResponse.gateway_reference,
        qris_url: providerResponse.qris_url ?? null,
        expired_at: providerResponse.expired_at,
      },
      tx
    );

    // Rule 5: Update order status to waiting_payment
    await orderRepository.updateStatus(orderId, "waiting_payment", tx);

    // Rule 6: Create OrderLog PAYMENT_STARTED
    await orderRepository.createOrderLog(
      {
        order_id: orderId,
        user_id: userId,
        action: "PAYMENT_STARTED",
        old_value: { status: "approved" },
        new_value: {
          status: "waiting_payment",
          payment_method: "qris",
          gateway: providerResponse.gateway,
          gateway_reference: providerResponse.gateway_reference,
        },
      },
      tx
    );

    return payment;
  });

  return {
    payment_id: result.id,
    order_id: orderId,
    order_number: order.order_number,
    amount: grandTotal,
    gateway: providerResponse.gateway,
    gateway_reference: providerResponse.gateway_reference,
    qris_url: providerResponse.qris_url ?? null,
    qris_payload: providerResponse.qris_payload ?? null,
    expired_at: providerResponse.expired_at,
    status: "pending",
  };
}

/**
 * Confirm a mock QRIS payment as paid (development only).
 *
 * Business Rules:
 * 1. Owner/cashier only.
 * 2. Payment must be pending and not expired.
 * 3. In transaction: payment → paid, order → paid, reduce stock, create movements/logs.
 */
export async function confirmMockPayment(
  paymentId: string,
  userId: string
): Promise<OrderResponse> {
  // Fetch payment with order and items
  const payment = await orderRepository.findPendingPaymentById(paymentId);

  if (!payment) {
    throw new AuthError("Payment not found", 404);
  }

  // Rule 2: Payment must be pending
  if (payment.status !== "pending") {
    throw new AuthError(
      `Payment is in "${payment.status}" status. Only pending payments can be confirmed.`,
      400
    );
  }

  // Rule 2: Payment must not be expired
  if (payment.expired_at && new Date() > payment.expired_at) {
    throw new AuthError(
      "Payment has expired. Please create a new QRIS payment.",
      400
    );
  }

  const order = payment.order;

  // Execute everything in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // Reduce stock for each item
    for (const item of order.items) {
      const baseQty = Number(item.base_qty);

      // Fetch current product stock inside transaction
      const product = await tx.product.findUnique({
        where: { id: item.product_id },
        select: { id: true, stock: true, name: true },
      });

      if (!product) {
        throw new AuthError(
          `Product "${item.product_name}" not found in inventory`,
          404
        );
      }

      // Check stock sufficiency
      const currentStock = Number(product.stock);
      if (currentStock < baseQty) {
        throw new AuthError(
          `Insufficient stock for "${item.product_name}". Available: ${currentStock}, required: ${baseQty}`,
          400
        );
      }

      // Calculate new stock after deduction
      const newStock = new Prisma.Decimal(currentStock).sub(
        new Prisma.Decimal(baseQty)
      );

      // Update product stock
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: newStock },
      });

      // Create StockMovement record
      await orderRepository.createStockMovement(
        {
          product_id: item.product_id,
          order_id: order.id,
          type: "sale" as const,
          qty: new Prisma.Decimal(baseQty).negated(),
          unit_name: item.unit_name,
          unit_qty: item.qty,
          stock_before: new Prisma.Decimal(currentStock),
          stock_after: newStock,
          created_by: userId,
        },
        tx
      );
    }

    // Confirm payment as paid and update order
    const updatedOrder = await orderRepository.confirmPaymentPaid(
      paymentId,
      order.id,
      userId,
      tx
    );

    // Create PaymentLog
    await orderRepository.createPaymentLog(
      {
        payment_id: paymentId,
        created_by: userId,
        event: "PAYMENT_CONFIRMED",
        payload: {
          method: "qris",
          gateway: payment.gateway,
          gateway_reference: payment.gateway_reference,
        },
      },
      tx
    );

    // Create OrderLog PAYMENT_PAID
    await orderRepository.createOrderLog(
      {
        order_id: order.id,
        user_id: userId,
        action: "PAYMENT_PAID",
        old_value: { status: "waiting_payment" },
        new_value: {
          status: "paid",
          payment_method: "qris",
          gateway: payment.gateway,
        },
      },
      tx
    );

    return updatedOrder;
  });

  return toResponse(result);
}
