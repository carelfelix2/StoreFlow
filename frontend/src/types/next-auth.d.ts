// =============================================================================
// Felix Snack POS — Auth.js v5 Type Augmentation
// Extends the built-in Auth.js types to include custom fields (role, id).
// Uses Prisma's generated UserRole enum for type consistency.
// =============================================================================

import { type DefaultSession } from "next-auth";
import type { UserRole } from "@/types/user";

declare module "next-auth" {
  /**
   * Extended User type returned by the Credentials authorize() callback
   * and stored in the JWT token.
   */
  interface User {
    role: UserRole;
    is_active: boolean;
  }

  /**
   * Extended Session type — the session.user object available on the client.
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      is_active: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT token type stored in the session cookie.
   */
  interface JWT {
    id: string;
    role: UserRole;
    is_active: boolean;
  }
}
