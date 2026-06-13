// =============================================================================
// Felix Snack POS — Orders API Client
// Client-side functions for order API calls.
// =============================================================================

import api, { apiPost, apiGet, apiPatch } from "@/lib/api";
import type { ApiPaginatedResponse } from "@/lib/api";

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
  completed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  items: OrderItemResponse[];
  logs?: OrderLogResponse[];
}

export interface OrderListMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface CreateOrderInput {
  customer_name?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    unit_name: string;
    qty: number;
  }>;
}

export interface OrderQueryParams {
  status?: string;
  page?: number;
  per_page?: number;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Create a new order from the staff cart.
 * POST /api/orders
 */
export async function createOrder(
  data: CreateOrderInput
): Promise<OrderResponse> {
  return apiPost<OrderResponse>("/orders", data);
}

/**
 * Get an order by its ID.
 * GET /api/orders/[id]
 */
export async function getOrderById(
  id: string
): Promise<OrderResponse> {
  return apiGet<OrderResponse>(`/orders/${id}`);
}

/**
 * List orders with optional status filter and pagination.
 * GET /api/orders?status=...&page=...&per_page=...
 */
export async function listOrders(
  params: OrderQueryParams = {}
): Promise<{ data: OrderResponse[]; meta: OrderListMeta }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  const url = `/orders${query ? `?${query}` : ""}`;

  // Use raw axios (not apiGet) because apiGet strips the outer envelope
  // and we need both the data array AND the meta from the paginated response.
  const response = await api.get<ApiPaginatedResponse<OrderResponse>>(url);
  const body = response.data;
  return {
    data: body.data,
    meta: {
      current_page: body.meta?.current_page ?? 1,
      per_page: body.meta?.per_page ?? 20,
      total: body.meta?.total ?? 0,
      last_page: body.meta?.last_page ?? 1,
    },
  };
}

/**
 * Review an order — transition from submitted to reviewing.
 * PATCH /api/orders/[id]/review
 */
export async function reviewOrder(
  id: string
): Promise<OrderResponse> {
  return apiPatch<OrderResponse>(`/orders/${id}/review`);
}

/**
 * Approve an order — transition from reviewing to approved.
 * PATCH /api/orders/[id]/approve
 */
export async function approveOrder(
  id: string
): Promise<OrderResponse> {
  return apiPatch<OrderResponse>(`/orders/${id}/approve`);
}

/**
 * Cancel an order — transition from submitted/reviewing to cancelled.
 * PATCH /api/orders/[id]/cancel
 */
export async function cancelOrder(
  id: string
): Promise<OrderResponse> {
  return apiPatch<OrderResponse>(`/orders/${id}/cancel`);
}

/**
 * Void an order — transition from paid/printed/completed to voided.
 * PATCH /api/orders/[id]/void
 * Owner only.
 */
export async function voidOrder(
  id: string
): Promise<OrderResponse> {
  return apiPatch<OrderResponse>(`/orders/${id}/void`);
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
 * GET /api/orders/[id]/receipt
 */
export async function getReceipt(
  id: string
): Promise<ReceiptResponse> {
  return apiGet<ReceiptResponse>(`/orders/${id}/receipt`);
}

/**
 * Mark an order as printed after successful print.
 * PATCH /api/orders/[id]/printed
 */
export async function markPrinted(
  id: string
): Promise<ReceiptResponse> {
  return apiPatch<ReceiptResponse>(`/orders/${id}/printed`);
}

// ---------------------------------------------------------------------------
// Phase 7A: QRIS Payment API Functions
// ---------------------------------------------------------------------------

/**
 * Response from initiating a QRIS payment.
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
 * Response from checking payment status.
 */
export interface PaymentStatusResponse {
  payment_id: string;
  order_id: string;
  gateway: string;
  gateway_reference: string;
  status: string;
  paid_at: Date | null;
}

/**
 * Initiate a QRIS payment for an approved order.
 * POST /api/orders/[id]/payments/qris
 */
export async function initiateQrisPayment(
  id: string
): Promise<QrisPaymentResponse> {
  return apiPost<QrisPaymentResponse>(
    `/orders/${id}/payments/qris`
  );
}

/**
 * Check the current status of a QRIS payment.
 * GET /api/payments/[id]/status
 */
export async function getPaymentStatus(
  id: string
): Promise<PaymentStatusResponse> {
  return apiGet<PaymentStatusResponse>(
    `/payments/${id}/status`
  );
}

/**
 * Simulate a mock QRIS payment as paid (development only).
 * POST /api/payments/[id]/mock-paid
 */
export async function confirmMockPaid(
  id: string
): Promise<OrderResponse> {
  return apiPost<OrderResponse>(
    `/payments/${id}/mock-paid`
  );
}

/**
 * Process a cash payment for an approved order.
 * POST /api/orders/[id]/payments/cash
 */
export async function processCashPayment(
  id: string,
  data: { paid_amount: number }
): Promise<OrderResponse> {
  return apiPost<OrderResponse>(
    `/orders/${id}/payments/cash`,
    data
  );
}
