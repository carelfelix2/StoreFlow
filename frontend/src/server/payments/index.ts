// =============================================================================
// Felix Snack POS — Payment Provider Registry
// Central registry for payment gateway providers.
//
// Supported providers:
//   - mock     (development/testing, no external keys required)
//   - duitku   (Indonesian payment gateway)
//   - midtrans (Indonesian payment gateway)
//   - xendit   (Indonesian payment gateway, optional)
//
// Provider selection is explicit via PAYMENT_PROVIDER env variable.
// =============================================================================

import type { PaymentProvider } from "./payment-provider";
import { mockProvider } from "./mock-provider";
import { duitkuProvider } from "./duitku-provider";
import { midtransProvider } from "./midtrans-provider";
import { xenditProvider } from "./xendit-provider";

/** Valid PAYMENT_PROVIDER values */
const ALLOWED_PROVIDERS = ["mock", "duitku", "midtrans", "xendit"] as const;
export type PaymentProviderName = (typeof ALLOWED_PROVIDERS)[number];

/**
 * Registry of available payment providers.
 * Key is the provider name used in the PAYMENT_PROVIDER env variable.
 */
const providers: Record<PaymentProviderName, PaymentProvider> = {
  mock: mockProvider,
  duitku: duitkuProvider,
  midtrans: midtransProvider,
  xendit: xenditProvider,
};

// ---------------------------------------------------------------------------
// Config Validation
// ---------------------------------------------------------------------------

/**
 * Required environment variables for each payment provider.
 */
const PROVIDER_REQUIRED_KEYS: Record<PaymentProviderName, string[]> = {
  mock: [], // mock requires no external keys
  duitku: ["DUITKU_MERCHANT_CODE", "DUITKU_API_KEY"],
  midtrans: ["MIDTRANS_SERVER_KEY", "MIDTRANS_CLIENT_KEY"],
  xendit: ["XENDIT_SECRET_KEY"],
};

/**
 * Validate that the selected provider has all required environment variables set.
 * Returns the provider name if valid, throws an error if not.
 */
function validateProviderConfig(name: PaymentProviderName): PaymentProviderName {
  const requiredKeys = PROVIDER_REQUIRED_KEYS[name];

  if (requiredKeys.length === 0) {
    return name; // mock needs no keys
  }

  const missingKeys = requiredKeys.filter(
    (key) => !process.env[key] || process.env[key]!.trim() === ""
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Payment provider "${name}" requires the following environment variables: ` +
      `${missingKeys.join(", ")}. ` +
      `Please set them in .env.local or switch to a different provider via PAYMENT_PROVIDER.`
    );
  }

  return name;
}

// ---------------------------------------------------------------------------
// Provider Selection
// ---------------------------------------------------------------------------

/**
 * Resolve the active payment provider name from environment.
 *
 * Rules:
 *   1. PAYMENT_PROVIDER must be explicitly set.
 *   2. Value must be one of: mock, duitku, midtrans, xendit.
 *   3. If not set or invalid → throw clear error.
 *   4. No auto-selection based on partial env keys.
 */
function resolveProviderName(): PaymentProviderName {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (!raw) {
    throw new Error(
      "PAYMENT_PROVIDER is not set. " +
      "Please add PAYMENT_PROVIDER=mock (or duitku, midtrans, xendit) to your .env.local file."
    );
  }

  if (!ALLOWED_PROVIDERS.includes(raw as PaymentProviderName)) {
    throw new Error(
      `Invalid PAYMENT_PROVIDER value: "${raw}". ` +
      `Allowed values are: ${ALLOWED_PROVIDERS.join(", ")}.`
    );
  }

  return raw as PaymentProviderName;
}

/**
 * Cached active provider instance.
 * Resolved once on first access. Set to null to force re-resolution.
 */
let cachedProvider: PaymentProvider | null = null;
let cachedProviderName: PaymentProviderName | null = null;

/**
 * Get the active payment provider based on PAYMENT_PROVIDER env variable.
 *
 * Selection is explicit — no auto-detection based on partial keys.
 * If the selected provider's required keys are missing, throws a clear error.
 *
 * The provider instance is cached after first successful resolution.
 */
export function getActivePaymentProvider(): PaymentProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const name = resolveProviderName();
  validateProviderConfig(name);

  cachedProviderName = name;
  cachedProvider = providers[name];

  console.log(`[payments] Using payment provider: ${name}`);
  return cachedProvider;
}

/**
 * Get a payment provider by name.
 * Use this when you need a specific provider regardless of env config.
 * Does NOT validate env keys — use getActivePaymentProvider() for that.
 */
export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Payment provider "${name}" not found. Available: ${ALLOWED_PROVIDERS.join(", ")}.`
    );
  }
  return provider;
}

/**
 * Get the name of the currently active payment provider.
 * Returns null if getActivePaymentProvider() has not been called yet.
 */
export function getActivePaymentProviderName(): PaymentProviderName | null {
  return cachedProviderName;
}

// Re-export types and providers
export type { PaymentProvider } from "./payment-provider";
export type {
  CreateQrisPaymentRequest,
  CreateQrisPaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  VerifyCallbackRequest,
  VerifyCallbackResponse,
  ParseCallbackPayloadRequest,
  ParseCallbackPayloadResponse,
} from "./payment-provider";
export { mockProvider } from "./mock-provider";
export { simulateMockPaymentPaid } from "./mock-provider";
export { duitkuProvider } from "./duitku-provider";
export { midtransProvider } from "./midtrans-provider";
export { xenditProvider } from "./xendit-provider";
