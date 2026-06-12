// =============================================================================
// Felix Snack POS — Dashboard API
// Re-exports the shared dashboard queries for API consumers.
// =============================================================================

import { requireRole } from "@/lib/auth-helpers";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { getDashboardData } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["owner"]);
    const data = await getDashboardData();
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
