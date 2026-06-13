// =============================================================================
// Felix Snack POS — Midtrans Payment Provider (Placeholder)
// TODO: Implement real Midtrans API integration.
//
// Midtrans API Reference: https://docs.midtrans.com/
//
// Required environment variables (add to .env.local):
//   MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
//   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
//   MIDTRANS_IS_PRODUCTION=false
//
// Midtrans Payment Flow:
//   1. Call Midtrans Snap API to create transaction → get redirect URL + token
//   2. Frontend opens Midtrans Snap popup or redirects to payment page
//   3. Customer completes payment via QRIS, GoPay, bank transfer, etc.
//   4. Midtrans sends HTTP notification (webhook) to CALLBACK_URL
//   5. Verify notification signature using server key + SHA512
//   6. Update payment status based on transaction_status
//
// Midtrans Status Mapping:
//   settlement / capture  → paid
//   pending               → pending
//   deny / cancel         → failed
//   expire                → expired
//   failure               → failed
//   refund / chargeback   → refunded
// =============================================================================

import type {
  PaymentProvider,
  CreateQrisPaymentRequest,
  CreateQrisPaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  VerifyCallbackRequest,
  VerifyCallbackResponse,
  ParseCallbackPayloadRequest,
  ParseCallbackPayloadResponse,
} from "./payment-provider";

/**
 * Midtrans payment provider.
 *
 * TODO: Implement the following methods:
 *
 * createQrisPayment():
 *   - Determine base URL from MIDTRANS_IS_PRODUCTION:
 *       sandbox: https://api.sandbox.midtrans.com
 *       production: https://api.midtrans.com
 *   - POST to /v2/charge with:
 *     {
 *       payment_type: "gopay",
 *       transaction_details: {
 *         order_id: request.order_number,
 *         gross_amount: request.amount,
 *       },
 *       customer_details: {
 *         first_name: request.customer_name ?? "Customer",
 *       },
 *       gopay: {
 *         enable_callback: true,
 *       },
 *     }
 *   - Authorization: "Basic " + Base64(MIDTRANS_SERVER_KEY + ":")
 *   - Parse response to extract:
 *       - actions[0].url (QRIS deeplink URL)
 *       - order_id (gateway reference)
 *       - expiry_time
 *   - Return CreateQrisPaymentResponse with qris_url
 *
 * checkPaymentStatus():
 *   - GET to /v2/{order_number}/status
 *   - Map transaction_status to our status enum
 *   - Return CheckPaymentStatusResponse
 *
 * verifyCallback():
 *   - Extract order_id, status_code, gross_amount, signature_key from payload
 *   - Compute expected signature:
 *       SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
 *   - Compare with payload.signature_key
 *   - Return VerifyCallbackResponse
 *
 * parseCallbackPayload():
 *   - Extract order_id, transaction_status, gross_amount from raw body
 *   - Map Midtrans transaction_status to our status enum
 *   - Return ParseCallbackPayloadResponse
 */
export const midtransProvider: PaymentProvider = {
  name: "midtrans",

  async createQrisPayment(
    _request: CreateQrisPaymentRequest
  ): Promise<CreateQrisPaymentResponse> {
    // TODO: Implement real Midtrans Snap API call
    throw new Error(
      "Midtrans provider not yet implemented. " +
      "Set MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, and MIDTRANS_IS_PRODUCTION " +
      "in .env.local, then implement the createQrisPayment method."
    );
  },

  async checkPaymentStatus(
    _request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    // TODO: Implement real Midtrans API call
    throw new Error(
      "Midtrans provider not yet implemented. " +
      "Implement the checkPaymentStatus method to query Midtrans transaction status."
    );
  },

  async verifyCallback(
    _request: VerifyCallbackRequest
  ): Promise<VerifyCallbackResponse> {
    // TODO: Implement real Midtrans signature verification using SHA512
    throw new Error(
      "Midtrans provider not yet implemented. " +
      "Implement the verifyCallback method to validate Midtrans webhook signatures."
    );
  },

  async parseCallbackPayload(
    _request: ParseCallbackPayloadRequest
  ): Promise<ParseCallbackPayloadResponse> {
    // TODO: Implement real Midtrans callback payload parsing
    throw new Error(
      "Midtrans provider not yet implemented. " +
      "Implement the parseCallbackPayload method to parse Midtrans webhook payloads."
    );
  },
};
