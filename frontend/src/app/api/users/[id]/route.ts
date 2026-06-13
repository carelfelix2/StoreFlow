// =============================================================================
// Felix Snack POS — User Detail API Route Handler
// GET    /api/users/[id]                  — Get user by ID (owner only)
// PUT    /api/users/[id]                  — Update user (owner only)
// PATCH  /api/users/[id]/reset-password   — Reset password (owner only)
// PATCH  /api/users/[id]/toggle-active    — Toggle active/inactive (owner only)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiSuccess,
  apiError,
  handleApiError,
} from "@/lib/api-response";
import {
  updateUserSchema,
  resetPasswordSchema,
} from "@/lib/validation/user";
import * as userService from "@/server/db/services/user-service";

/**
 * GET /api/users/[id]
 * Get a single user by ID.
 *
 * Access: Owner only
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["owner"]);

    const { id } = await params;
    const user = await userService.getUserById(id);

    if (!user) {
      return apiError("User tidak ditemukan", 404);
    }

    return apiSuccess(user, "User loaded successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/users/[id]
 * Update user details (name, email, role).
 *
 * Access: Owner only
 *
 * Body (all optional):
 *   - name: string
 *   - email: string
 *   - role: "owner" | "cashier" | "staff"
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(["owner"]);

    const { id } = await params;
    const body = await request.json();
    const input = updateUserSchema.parse(body);

    const user = await userService.updateUser(id, input, currentUser.id);

    return apiSuccess(user, `User "${user.name}" berhasil diperbarui`);
  } catch (error) {
    return handleApiError(error);
  }
}
