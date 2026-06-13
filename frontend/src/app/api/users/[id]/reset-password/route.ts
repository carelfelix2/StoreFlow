// =============================================================================
// Felix Snack POS — Reset Password API Route Handler
// PATCH /api/users/[id]/reset-password
// Owner-only: reset a user's password (not their own).
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { resetPasswordSchema } from "@/lib/validation/user";
import * as userService from "@/server/db/services/user-service";

/**
 * PATCH /api/users/[id]/reset-password
 * Reset a user's password.
 *
 * Access: Owner only
 * Business rule: Owner cannot reset their own password from this endpoint.
 *
 * Body:
 *   - password: string (required, min 6 chars)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["owner"]);

    const { id } = await params;
    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    const user = await userService.resetUserPassword(id, input, currentUser.id);

    return apiSuccess(user, `Password untuk "${user.name}" berhasil direset`);
  } catch (error) {
    return handleApiError(error);
  }
}
