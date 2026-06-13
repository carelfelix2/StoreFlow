// =============================================================================
// Felix Snack POS — Xendit Payment Provider (Placeholder — Optional)
// TODO: Implement real Xendit API integration if needed.
//
// Xendit API Reference: https://developers.xendit.co/
//
// Required environment variables (add to .env.local):
//   XENDIT_SECRET_KEY=xnd_development_xxx
//   XENDIT_CALLBACK_TOKEN=xxx
//   XENDIT_IS_PRODUCTION=false
//
// Xendit Payment Flow:
//   1. Call Xendit QR Code API to create QR code → get QR string + external_id
//   2. Display QR code to customer
//   3. Customer scans QR code using their banking/payment app
//   4. Xendit sends webhook callback to CALLBACK_URL
//   5. Verify callback signature using XENDIT_CALLBACK_TOKEN (X-Callback-Token header)
//   6. Update payment status based on callback status
//
// Xendit Status Mapping:
//   SUCCEEDED  → paid
//   PENDING    → pending
//   FAILED     → failed
//   EXPIRED    → expired
//   VOIDED     → failed
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
 * Xendit payment provider (optional).
 *
 * TODO: Implement the following methods if Xendit integration is needed:
 *
 * createQrisPayment():
 *   - POST to https://api.xendit.co/qr_codes
 *   - Authorization: "Basic " + Base64(XENDIT_SECRET_KEY + ":")
 *   - Request body:
 *     {
 *       external_id: request.order_number,
 *       type: "DYNAMIC",
 *       callback_url: process.env.XENDIT_CALLBACK_URL,
 *       amount: request.amount,
 *       expiration_date: ISO8601 string from expiry_minutes,
 *     }
 *   - Parse response to extract:
 *       - qr_string (QR code data)
 *       - external_id (gateway reference)
 *       - expires_at
 *   - Return CreateQrisPaymentResponse
 *
 * checkPaymentStatus():
 *   - GET to https://api.xendit.co/qr_codes/{external_id}
 *   - Map status to our status enum
 *   - Return CheckPaymentStatusResponse
 *
 * verifyCallback():
 *   - Extract X-Callback-Token from callback headers
 *   - Compare with XENDIT_CALLBACK_TOKEN
 *   - Extract status, external_id from payload
 *   - Return VerifyCallbackResponse
 *
 * parseCallbackPayload():
 *   - Extract event, data.status, data.external_id from raw body
 *   - Map Xendit status to our status enum
 *   - Return ParseCallbackPayloadResponse
 */
export const xenditProvider: PaymentProvider = {
  name: "xendit",

  async createQrisPayment(
    _request: CreateQrisPaymentRequest
  ): Promise<CreateQrisPaymentResponse> {
    // TODO: Implement real Xendit API call
    throw new Error(
      "Xendit provider not yet implemented. " +
      "Set XENDIT_SECRET_KEY and XENDIT_CALLBACK_TOKEN in .env.local, " +
      "then implement the createQrisPayment method."
    );
  },

  async checkPaymentStatus(
    _request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    // TODO: Implement real Xendit API call
    throw new Error(
      "Xendit provider not yet implemented. " +
      "Implement the checkPaymentStatus method to query Xendit QR code status."
    );
  },

  async verifyCallback(
    _request: VerifyCallbackRequest
  ): Promise<VerifyCallbackResponse> {
    // TODO: Implement real Xendit callback verification
    throw new Error(
      "Xendit provider not yet implemented. " +
      "Implement the verifyCallback method to validate Xendit webhook signatures."
    );
  },

  async parseCallbackPayload(
    _request: ParseCallbackPayloadRequest
  ): Promise<ParseCallbackPayloadResponse> {
    // TODO: Implement real Xendit callback payload parsing
    throw new Error(
      "Xendit provider not yet implemented. " +
      "Implement the parseCallbackPayload method to parse Xendit webhook payloads."
    );
  },
};
