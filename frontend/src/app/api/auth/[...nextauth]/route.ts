// =============================================================================
// Felix Snack POS — Auth.js v5 Catch-all Route Handler
// Handles all Auth.js API routes: /api/auth/signin, /api/auth/callback,
// /api/auth/session, /api/auth/csrf, /api/auth/signout, etc.
// =============================================================================

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
