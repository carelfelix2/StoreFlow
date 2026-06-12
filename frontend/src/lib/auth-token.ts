// =============================================================================
// Felix Snack POS — Auth Token Utilities (DEPRECATED)
//
// IMPORTANT: This file is deprecated. Authentication now uses Auth.js v5
// (next-auth) with JWT session strategy. Custom HMAC tokens are no longer
// used. This file is kept for reference only and will be removed in a future
// cleanup phase.
//
// Migration:
//   - Token creation: Auth.js handles JWT signing automatically
//   - Token verification: Auth.js middleware/auth() handles verification
//   - Session management: Auth.js session callbacks
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_SECRET = process.env["AUTH_TOKEN_SECRET"] || "dev-secret-change-in-production";
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Token payload stored inside the signed token.
 */
interface TokenPayload {
  userId: string;
  exp: number; // expiration timestamp (ms)
}

/**
 * Create a signed auth token for a user.
 * Format: base64(payload).base64(signature)
 * The payload contains userId + expiration.
 * The signature is HMAC-SHA256 of the payload.
 *
 * @deprecated Use Auth.js signIn() instead.
 */
export function createToken(userId: string): string {
  const payload: TokenPayload = {
    userId,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");
  const signature = sign(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed token.
 * Returns the userId if valid, null if invalid/expired.
 *
 * @deprecated Use Auth.js auth() or middleware instead.
 */
export function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;

    // Verify signature
    const expectedSignature = sign(payloadBase64);
    if (!constantTimeCompare(signature, expectedSignature)) {
      return null;
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload: TokenPayload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * Sign a string with HMAC-SHA256.
 */
function sign(data: string): string {
  return createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
