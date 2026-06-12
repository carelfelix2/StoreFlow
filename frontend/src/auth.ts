// =============================================================================
// Felix Snack POS — Auth.js v5 Configuration
// Uses Credentials provider with JWT session strategy.
// Custom JWT/session callbacks inject role and id for role-based access.
//
// IMPORTANT: Prisma is lazy-imported inside the authorize() callback so that
// this module can be safely imported by middleware.ts (Edge Runtime) without
// pulling in Node.js built-in modules (node:path, node:url) used by Prisma.
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/types/user";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Lazy-import Prisma so this module can be loaded in Edge Runtime
        // without pulling in Node.js built-in modules at the top level.
        const { prisma } = await import("@/lib/prisma");

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        // Reject inactive users
        if (!user.is_active) {
          throw new Error("Akun telah dinonaktifkan. Hubungi pemilik toko.");
        }

        // Verify password
        const bcrypt = await import("bcryptjs");
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          is_active: user.is_active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT on sign in
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.is_active = user.is_active;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session from JWT
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.is_active = token.is_active as boolean;
      }
      return session;
    },
  },
});
