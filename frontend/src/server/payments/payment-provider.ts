// =============================================================================
// Felix Snack POS — Payment Provider Interface
// Abstract interface for payment gateway integrations.
// Each provider (mock, Duitku, etc.) implements this interface.
// =============================================================================

/**
 * Request to create a QRIS payment for an order.
 */
export interface CreateQrisPaymentRequest {
  order_id: string;
  order_number: string;
  amount: number;
  customer_name?: string | null;
  /** ISO 8601 duration string, e.g. "15m" for 15 minutes */
  expiry_minutes?: number;
}

/**
 * Response from creating a QRIS payment.
 */
export interface CreateQrisPaymentResponse {
  success: boolean;
  gateway: string;
  gateway_reference: string;
  qris_url?: string;
  qris_payload?: string;
  qris_image?: string;
  expired_at: Date;
  raw?: Record<string, unknown>;
}

/**
 * Request to check the status of a payment.
 */
export interface CheckPaymentStatusRequest {
  gateway_reference: string;
}

/**
 * Response from checking payment status.
 */
export interface CheckPaymentStatusResponse {
  success: boolean;
  status: "pending" | "paid" | "failed" | "expired";
  gateway: string;
  gateway_reference: string;
  paid_at?: Date;
  raw?: Record<string, unknown>;
}

/**
 * Request to verify a payment callback/webhook payload.
 */
export interface VerifyCallbackRequest {
  /** Raw payload from the gateway callback */
  payload: Record<string, unknown>;
  /** Signature or HMAC from the gateway */
  signature?: string;
}

/**
 * Response from verifying a callback.
 */
export interface VerifyCallbackResponse {
  verified: boolean;
  gateway_reference: string;
  status: "pending" | "paid" | "failed" | "expired";
  order_id?: string;
}

/**
 * Payment provider interface.
 * All payment gateway integrations must implement this interface.
 */
export interface PaymentProvider {
  /** Provider name identifier (e.g., "mock", "duitku") */
  readonly name: string;

  /**
   * Create a QRIS payment for an order.
   * Returns the QRIS payment details (URL, payload, or image).
   */
  createQrisPayment(request: CreateQrisPaymentRequest): Promise<CreateQrisPaymentResponse>;

  /**
   * Check the current status of a payment by gateway reference.
   */
  checkPaymentStatus(request: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse>;

  /**
   * Verify a callback/webhook payload from the payment gateway.
   * Validates signature and extracts payment status.
   */
  verifyCallback(request: VerifyCallbackRequest): Promise<VerifyCallbackResponse>;
}
