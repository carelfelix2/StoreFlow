// =============================================================================
// Felix Snack POS — Mock Payment Provider
// Simulates QRIS payment flow for development and testing.
// Generates mock QRIS data and simulates payment status transitions.
// =============================================================================

import { randomUUID } from "crypto";
import type {
  PaymentProvider,
  CreateQrisPaymentRequest,
  CreateQrisPaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  VerifyCallbackRequest,
  VerifyCallbackResponse,
} from "./payment-provider";

/**
 * In-memory store for mock payment statuses.
 * In production, this would be replaced by querying the gateway API.
 */
const mockPaymentStore = new Map<string, "pending" | "paid" | "failed" | "expired">();

/**
 * Mock QRIS payment provider.
 * Generates a mock QRIS payload (simulated QR string) and tracks status in memory.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createQrisPayment(
    request: CreateQrisPaymentRequest
  ): Promise<CreateQrisPaymentResponse> {
    const gatewayReference = `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const expiryMinutes = request.expiry_minutes ?? 15;
    const expiredAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    // Store initial pending status
    mockPaymentStore.set(gatewayReference, "pending");

    // Generate a mock QRIS payload (simulated QR string)
    // Format: MOCKQRIS|order_id|order_number|amount|reference|expired_at
    const qrisPayload = [
      "MOCKQRIS",
      request.order_id,
      request.order_number,
      request.amount.toFixed(2),
      gatewayReference,
      expiredAt.toISOString(),
    ].join("|");

    return {
      success: true,
      gateway: "mock",
      gateway_reference: gatewayReference,
      qris_url: undefined,
      qris_payload: qrisPayload,
      qris_image: undefined,
      expired_at: expiredAt,
      raw: {
        order_id: request.order_id,
        order_number: request.order_number,
        amount: request.amount,
        expiry_minutes: expiryMinutes,
      },
    };
  },

  async checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    const status = mockPaymentStore.get(request.gateway_reference) ?? "pending";

    const response: CheckPaymentStatusResponse = {
      success: true,
      status,
      gateway: "mock",
      gateway_reference: request.gateway_reference,
      paid_at: status === "paid" ? new Date() : undefined,
      raw: { checked_at: new Date().toISOString() },
    };

    return response;
  },

  async verifyCallback(
    request: VerifyCallbackRequest
  ): Promise<VerifyCallbackResponse> {
    // Mock verification: accept any payload with a gateway_reference
    const gatewayReference = request.payload.gateway_reference as string;
    const status = (request.payload.status as string) ?? "paid";

    if (!gatewayReference) {
      return {
        verified: false,
        gateway_reference: "",
        status: "failed",
      };
    }

    return {
      verified: true,
      gateway_reference: gatewayReference,
      status: status as "pending" | "paid" | "failed" | "expired",
      order_id: request.payload.order_id as string,
    };
  },
};

/**
 * Simulate a mock payment as paid (for development/testing).
 * This is called by the POST /api/payments/[id]/mock-paid endpoint.
 */
export function simulateMockPaymentPaid(gatewayReference: string): boolean {
  if (!mockPaymentStore.has(gatewayReference)) {
    return false;
  }
  mockPaymentStore.set(gatewayReference, "paid");
  return true;
}

/**
 * Simulate a mock payment as expired (for development/testing).
 */
export function simulateMockPaymentExpired(gatewayReference: string): boolean {
  if (!mockPaymentStore.has(gatewayReference)) {
    return false;
  }
  mockPaymentStore.set(gatewayReference, "expired");
  return true;
}
