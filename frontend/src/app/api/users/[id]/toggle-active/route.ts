// =============================================================================
// Felix Snack POS — Toggle Active API Route Handler
// PATCH /api/users/[id]/toggle-active
// Owner-only: toggle user active/inactive status.
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import * as userService from "@/server/db/services/user-service";

/**
 * PATCH /api/users/[id]/toggle-active
 * Toggle user active/inactive status.
 *
 * Access: Owner only
 * Business rule: Owner cannot deactivate their own account.
 * Inactive users cannot login (enforced in auth.ts authorize callback).
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["owner"]);

    const { id } = await params;
    const user = await userService.toggleUserActive(id, currentUser.id);

    const status = user.is_active ? "diaktifkan" : "dinonaktifkan";
    return apiSuccess(user, `User "${user.name}" berhasil ${status}`);
  } catch (error) {
    return handleApiError(error);
  }
}
