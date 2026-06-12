// =============================================================================
// Felix Snack POS — Client-side Auth Helpers (Deprecated)
//
// IMPORTANT: This file is kept for reference only.
// Authentication is now handled by Auth.js v5 (next-auth).
// Use `signIn()` and `signOut()` from `next-auth/react` directly.
//
// Migration guide:
//   - Login:  `signIn("credentials", { email, password, redirect: false })`
//   - Logout: `signOut({ redirect: false })`
//   - Session: `useSession()` from `next-auth/react`
//   - Server:  `auth()` from `@/auth`
// =============================================================================

import { signIn, signOut } from "next-auth/react";

/**
 * Login using Auth.js Credentials provider.
 * Returns the signIn result with error info if login fails.
 */
export async function loginApi(email: string, password: string) {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  if (!result?.ok) {
    throw new Error("Login failed");
  }

  return result;
}

/**
 * Logout using Auth.js signOut.
 */
export async function logoutApi() {
  await signOut({ redirect: false });
}
