// =============================================================================
// Felix Snack POS — Edge-safe Auth Helper
// Used by proxy.ts (Edge Runtime) to verify Auth.js JWT session tokens.
// Does NOT import Prisma, bcrypt, or any Node.js built-in modules.
// Uses @auth/core/jwt which relies on Web Crypto API (Edge-compatible).
// =============================================================================

import { getToken } from "@auth/core/jwt";

/**
 * Shape of the JWT payload we embed via the jwt() callback in auth.ts.
 * Only the fields needed for Edge-level routing decisions are included.
 */
export interface EdgeAuthUser {
  /** User's unique ID (sub in JWT) */
  id?: string;
  /** User's role for route access decisions */
  role?: string;
  /** User's name */
  name?: string;
  /** User's email */
  email?: string;
}

/**
 * Shape returned by the Edge auth check.
 */
export interface EdgeSession {
  user?: EdgeAuthUser;
}

/**
 * Read and verify the Auth.js JWT session token from the request cookies.
 * This runs in Edge Runtime — no Prisma, no database queries.
 *
 * The JWT is encrypted (JWE) using A256CBC-HS512.
 * We use @auth/core/jwt's getToken() which handles decryption using AUTH_SECRET.
 *
 * @param request - The incoming request (Edge-compatible Request or NextRequest)
 * @returns The decoded session, or null if not authenticated
 */
export async function getEdgeSession(
  request: Request
): Promise<EdgeSession | null> {
  try {
    const secret = process.env["AUTH_SECRET"];
    if (!secret) {
      console.warn("[auth-edge] AUTH_SECRET is not set");
      return null;
    }

    // getToken() reads the cookie, decrypts the JWT, and returns the payload
    const token = await getToken({
      req: request,
      secret,
      // In dev (http), the cookie name is "authjs.session-token" (no __Secure- prefix)
      // In production (https), it would be "__Secure-authjs.session-token"
      // getToken() handles this automatically via secureCookie detection
    });

    if (!token) {
      return null;
    }

    return {
      user: {
        id: token.sub,
        role: token.role as string | undefined,
        name: token.name as string | undefined,
        email: token.email as string | undefined,
      },
    };
  } catch (error) {
    console.error("[auth-edge] Failed to verify session:", error);
    return null;
  }
}
