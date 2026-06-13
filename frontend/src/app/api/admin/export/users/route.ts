// =============================================================================
// Felix Snack POS — Admin Backup Export: Users CSV
// GET /api/admin/export/users
// Owner only. Returns all users as CSV download (passwords excluded).
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/users
 * Export all users as CSV. Passwords are NOT included.
 */
export async function GET() {
  try {
    await requireRole(["owner"]);

    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    const headers = ["id", "name", "email", "role", "is_active", "created_at", "updated_at"];
    const rows = users.map((u) => [
      u.id,
      escapeCsv(u.name),
      u.email,
      u.role,
      u.is_active ? "true" : "false",
      u.created_at.toISOString(),
      u.updated_at.toISOString(),
    ]);

    const csv = buildCsv(headers, rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users-export-${dateStamp()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(headers: string[], rows: string[][]): string {
  return [headers.join(","), ...rows.map((r) => r.join(",")), ""].join("\n");
}

function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}
