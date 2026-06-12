// =============================================================================
// Felix Snack POS — Payment Provider Registry
// Central registry for payment gateway providers.
// Currently supports: mock (development), duitku (placeholder).
// =============================================================================

import type { PaymentProvider } from "./payment-provider";
import { mockProvider } from "./mock-provider";
import { duitkuProvider } from "./duitku-provider";

/**
 * Registry of available payment providers.
 * Key is the provider name used in the Payment.gateway field.
 */
const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  duitku: duitkuProvider,
};

/**
 * Get a payment provider by name.
 * Falls back to mock provider if the requested provider is not found.
 */
export function getPaymentProvider(name: string = "mock"): PaymentProvider {
  const provider = providers[name];
  if (!provider) {
    console.warn(
      `Payment provider "${name}" not found. Falling back to mock provider.`
    );
    return mockProvider;
  }
  return provider;
}

/**
 * Get the active payment provider based on environment configuration.
 * When DUITKU_MERCHANT_CODE is set, use Duitku provider.
 * Otherwise, use mock provider for development.
 */
export function getActivePaymentProvider(): PaymentProvider {
  const duitkuMerchantCode = process.env.DUITKU_MERCHANT_CODE;

  if (duitkuMerchantCode) {
    return duitkuProvider;
  }

  return mockProvider;
}

export type { PaymentProvider } from "./payment-provider";
export type {
  CreateQrisPaymentRequest,
  CreateQrisPaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  VerifyCallbackRequest,
  VerifyCallbackResponse,
} from "./payment-provider";
export { mockProvider } from "./mock-provider";
export { simulateMockPaymentPaid } from "./mock-provider";
export { duitkuProvider } from "./duitku-provider";
