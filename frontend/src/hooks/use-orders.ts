// =============================================================================
// Felix Snack POS — Orders Hooks
// TanStack Query hooks for order operations.
// =============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "@/lib/api/orders";
import type { CreateOrderInput, OrderQueryParams } from "@/lib/api/orders";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const orderKeys = {
  all: ["orders"] as const,
  list: (params?: OrderQueryParams) => ["orders", "list", params] as const,
  detail: (id: string) => ["orders", id] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Create a new order from the staff cart.
 * Invalidates the order list on success.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => ordersApi.createOrder(data),
    onSuccess: () => {
      // Invalidate the order list queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * Get an order by its ID.
 */
export function useOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => ordersApi.getOrderById(id!),
    enabled: !!id,
  });
}

/**
 * List orders with optional status filter and pagination.
 */
export function useOrders(params: OrderQueryParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.listOrders(params),
  });
}

/**
 * Review an order — transition from submitted to reviewing.
 */
export function useReviewOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.reviewOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
    },
  });
}

/**
 * Approve an order — transition from reviewing to approved.
 */
export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.approveOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
    },
  });
}

/**
 * Cancel an order — transition from submitted/reviewing to cancelled.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Phase 6: Receipt & Print Hooks
// ---------------------------------------------------------------------------

/**
 * Get receipt data for a paid order.
 * GET /api/orders/[id]/receipt
 */
export function useReceipt(id: string | null) {
  return useQuery({
    queryKey: ["receipt", id],
    queryFn: () => ordersApi.getReceipt(id!),
    enabled: !!id,
  });
}

/**
 * Mark an order as printed after successful print.
 * PATCH /api/orders/[id]/printed
 */
export function useMarkPrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.markPrinted(id),
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(receipt.order_id) });
      queryClient.invalidateQueries({ queryKey: ["receipt", receipt.order_id] });
    },
  });
}

// ---------------------------------------------------------------------------
// Phase 7A: QRIS Payment Hooks
// ---------------------------------------------------------------------------

/**
 * Initiate a QRIS payment for an approved order.
 * POST /api/orders/[id]/payments/qris
 */
export function useInitiateQrisPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.initiateQrisPayment(id),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(payment.order_id) });
    },
  });
}

/**
 * Check the current status of a QRIS payment.
 * GET /api/payments/[id]/status
 */
export function usePaymentStatus(id: string | null) {
  return useQuery({
    queryKey: ["payment-status", id],
    queryFn: () => ordersApi.getPaymentStatus(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds while payment is pending
      const data = query.state.data;
      if (data && data.status === "pending") {
        return 5000;
      }
      return false;
    },
  });
}

/**
 * Simulate a mock QRIS payment as paid (development only).
 * POST /api/payments/[id]/mock-paid
 */
export function useConfirmMockPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.confirmMockPaid(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: ["receipt", order.id] });
    },
  });
}

/**
 * Process a cash payment for an approved order.
 * Invalidates all order queries on success.
 */
export function useProcessCashPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      paid_amount,
    }: {
      id: string;
      paid_amount: number;
    }) => ordersApi.processCashPayment(id, { paid_amount }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
    },
  });
}
