// =============================================================================
// Felix Snack POS — Next.js 16 Proxy (Edge Runtime)
// Replaces middleware.ts. Next.js 16 recommends proxy over middleware.
// This file runs in Edge Runtime and must NOT import Prisma or @/auth.
// Uses @/lib/auth-edge for JWT verification (Edge-safe, no Node.js modules).
//
// Role-based route protection is handled here at the Edge level.
// Strict role enforcement is also done server-side in auth-helpers.ts.
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEdgeSession } from "@/lib/auth-edge";

/**
 * Role-based route access matrix.
 * Each path prefix maps to the roles that are allowed to access it.
 * Paths NOT listed here are public (like /login, /customer-display).
 */
const ROLE_ROUTE_MAP: Record<string, string[]> = {
  "/dashboard": ["owner"],
  "/products": ["owner", "cashier"],
  "/stock": ["owner"],
  "/reports": ["owner", "cashier"],
  "/settings": ["owner"],
  "/cashier": ["owner", "cashier"],
  "/staff/order": ["owner", "cashier", "staff"],
  "/staff/order-success": ["owner", "cashier", "staff"],
};

/**
 * Which role gets redirected to which default route.
 */
const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  owner: "/dashboard",
  cashier: "/cashier",
  staff: "/staff/order",
};

/**
 * Next.js 16 proxy handler.
 * Runs on every request (except static assets matched by config).
 * Verifies Auth.js JWT session token from cookies using Edge-safe APIs.
 */
export default async function handler(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- RULE 1: Customer display is public ---
  if (pathname.startsWith("/customer-display")) {
    return NextResponse.next();
  }

  // --- RULE 2: API auth routes are handled by Auth.js ---
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // --- RULE 3: Static assets and Next.js internals ---
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // Verify the Auth.js JWT session token from cookies
  const session = await getEdgeSession(request);
  const user = session?.user;

  // --- RULE 4: Authenticated users on /login or / → redirect to role default ---
  if (pathname === "/login" || pathname === "/") {
    if (user?.role) {
      const defaultRoute = ROLE_DEFAULT_ROUTES[user.role] || "/dashboard";
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }
    return NextResponse.next();
  }

  // --- RULE 5: Unauthenticated users → redirect to /login ---
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- RULE 6: Role-based route protection ---
  const matchedRoute = Object.keys(ROLE_ROUTE_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (matchedRoute) {
    const allowedRoles = ROLE_ROUTE_MAP[matchedRoute];
    if (!user.role || !allowedRoles.includes(user.role)) {
      // Redirect to role's default page
      const role = user.role || "";
      const defaultRoute = ROLE_DEFAULT_ROUTES[role] || "/login";
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (SVG, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
