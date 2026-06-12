// =============================================================================
// Felix Snack POS — Duitku Payment Provider (Placeholder)
// TODO: Implement real Duitku API integration.
//
// Duitku API Reference: https://docs.duitku.com/
//
// Required environment variables (add to .env.local):
//   DUITKU_MERCHANT_CODE=
//   DUITKU_API_KEY=
//   DUITKU_CALLBACK_URL=
//   DUITKU_RETURN_URL=
//   DUITKU_ENVIRONMENT=sandbox
//
// Duitku Payment Flow:
//   1. Call Duitku API to create invoice → get payment URL + reference
//   2. Redirect user to Duitku payment page or show QRIS
//   3. Duitku sends callback to CALLBACK_URL with payment result
//   4. Verify callback signature using API key
//   5. Update payment status based on callback result
// =============================================================================

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
 * Duitku payment provider.
 *
 * TODO: Implement the following methods:
 *
 * createQrisPayment():
 *   - POST to Duitku API /api/v2/merchant/invoice
 *   - Request body:
 *     {
 *       merchantCode: process.env.DUITKU_MERCHANT_CODE,
 *       paymentAmount: request.amount,
 *       merchantOrderId: request.order_number,
 *       productDetails: `Order ${request.order_number}`,
 *       customerVaName: request.customer_name ?? "Customer",
 *       callbackUrl: process.env.DUITKU_CALLBACK_URL,
 *       returnUrl: process.env.DUITKU_RETURN_URL,
 *       signature: md5(merchantCode + merchantOrderId + amount + apiKey),
 *       expiryPeriod: request.expiry_minutes ?? 15,
 *     }
 *   - Parse response to extract paymentUrl (for QRIS) and reference
 *   - Return CreateQrisPaymentResponse with qris_url
 *
 * checkPaymentStatus():
 *   - POST to Duitku API /api/v2/merchant/transactionStatus
 *   - Request body:
 *     {
 *       merchantCode: process.env.DUITKU_MERCHANT_CODE,
 *       merchantOrderId: request.order_number, // or use reference
 *       signature: md5(merchantCode + merchantOrderId + apiKey),
 *     }
 *   - Map Duitku status codes to our status:
 *     SUCCESS → paid
 *     PENDING → pending
 *     FAILED  → failed
 *     EXPIRED → expired
 *
 * verifyCallback():
 *   - Extract merchantCode, amount, merchantOrderId, reference from payload
 *   - Compute signature: md5(merchantCode + amount + merchantOrderId + apiKey)
 *   - Compare with payload.signature
 *   - Map resultCode to status
 *   - Return VerifyCallbackResponse
 */
export const duitkuProvider: PaymentProvider = {
  name: "duitku",

  async createQrisPayment(
    _request: CreateQrisPaymentRequest
  ): Promise<CreateQrisPaymentResponse> {
    // TODO: Implement real Duitku API call
    throw new Error(
      "Duitku provider not yet implemented. " +
      "Set DUITKU_MERCHANT_CODE, DUITKU_API_KEY, DUITKU_CALLBACK_URL, " +
      "DUITKU_RETURN_URL, and DUITKU_ENVIRONMENT in .env.local, " +
      "then implement the createQrisPayment method."
    );
  },

  async checkPaymentStatus(
    _request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    // TODO: Implement real Duitku API call
    throw new Error(
      "Duitku provider not yet implemented. " +
      "Implement the checkPaymentStatus method to query Duitku transaction status."
    );
  },

  async verifyCallback(
    _request: VerifyCallbackRequest
  ): Promise<VerifyCallbackResponse> {
    // TODO: Implement real Duitku signature verification
    throw new Error(
      "Duitku provider not yet implemented. " +
      "Implement the verifyCallback method to validate Duitku webhook signatures."
    );
  },
};
