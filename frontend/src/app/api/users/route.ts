// =============================================================================
// Felix Snack POS — Users API Route Handler
// GET  /api/users       — List users (owner only)
// POST /api/users       — Create user (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiCreated,
  handleApiError,
  apiPaginated,
} from "@/lib/api-response";
import {
  createUserSchema,
  userQuerySchema,
} from "@/lib/validation/user";
import * as userService from "@/server/db/services/user-service";

/**
 * GET /api/users
 * List users with optional search, role filter, is_active filter, and pagination.
 *
 * Access: Owner only
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner"]);

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = userQuerySchema.parse(rawQuery);

    const result = await userService.listUsers(query);

    return apiPaginated(
      result.data,
      result.total,
      result.page,
      result.per_page
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/users
 * Create a new user account.
 *
 * Access: Owner only
 *
 * Body:
 *   - name: string (required)
 *   - email: string (required, unique)
 *   - password: string (required, min 6 chars)
 *   - role: "owner" | "cashier" | "staff" (required)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(["owner"]);

    const body = await request.json();
    const input = createUserSchema.parse(body);

    const user = await userService.createUser(input);

    return apiCreated(user, `User "${user.name}" berhasil dibuat`);
  } catch (error) {
    return handleApiError(error);
  }
}
