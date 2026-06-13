// =============================================================================
// Felix Snack POS — Customer Display API Route Handler
// GET  /api/customer-display/[deviceId]
// =============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getDisplayState } from "@/server/customer-display/display-state";
import * as orderRepository from "@/server/db/repositories/order-repository";
import type { CustomerDisplayData } from "@/types/customer-display";

/**
 * GET /api/customer-display/[deviceId]
 *
 * Polled by the customer display page every 2 seconds.
 * Returns the full display data based on the stored device state.
 *
 * Access:
 *   - Public (no auth required — this is a customer-facing display)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const state = getDisplayState(deviceId);

    // Fetch store settings for store name
    const storeSettings = await orderRepository.getStoreSettings();

    // Base response - idle state
    const response: CustomerDisplayData = {
      device_id: deviceId,
      state: state.state,
      order_id: state.order_id,
      order_number: null,
      customer_name: null,
      items: [],
      subtotal: 0,
      discount_total: 0,
      tax_total: 0,
      grand_total: 0,
      payment_method: null,
      paid_amount: state.paid_amount,
      change_amount: state.change_amount,
      qris_url: null,
      qris_payload: null,
      qris_expired_at: null,
      store_name: storeSettings?.store_name ?? "Felix Snack",
      updated_at: state.updated_at,
    };

    // If no order is active, return idle/default
    if (!state.order_id) {
      return apiSuccess(response);
    }

    // Fetch order with items and payments
    try {
      const order = await orderRepository.findOrderWithPayments(state.order_id);
      if (order) {
        response.order_number = order.order_number;
        response.customer_name = order.customer_name;
        response.subtotal = Number(order.subtotal);
        response.discount_total = Number(order.discount_total);
        response.tax_total = Number(order.tax_total);
        response.grand_total = Number(order.grand_total);

        response.items = order.items.map((item) => ({
          product_name: item.product_name,
          qty: Number(item.qty),
          unit_name: item.unit_name,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
        }));

        // Payment info
        if (order.payments && order.payments.length > 0) {
          const payment = order.payments[0];
          response.payment_method = payment.method;
          response.paid_amount = Number(payment.paid_amount);
          response.change_amount = Number(payment.change_amount);
          response.qris_url = payment.qris_url;
          response.qris_expired_at = payment.expired_at?.toISOString() ?? null;
        }

        // Auto-derive state from order status when applicable
        if (state.state === "viewing_order") {
          if (
            order.status === "waiting_payment" &&
            order.payments &&
            order.payments.length > 0
          ) {
            // Order transitioned to waiting_payment — auto transition display
            response.state = "waiting_payment";
          } else if (order.status === "paid") {
            response.state = "paid";
          } else if (order.status === "printed") {
            response.state = "printed";
          }
        }
      }
    } catch {
      // If order not found, just return idle data — order may have been deleted
    }

    return apiSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
