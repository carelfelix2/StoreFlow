// =============================================================================
// Felix Snack POS — Summary Report API
// GET /api/reports/summary
// Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Access: owner, cashier
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { summaryReportQuerySchema } from "@/lib/validation/report";
import * as reportService from "@/server/db/services/report-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = summaryReportQuerySchema.parse(rawQuery);

    const report = await reportService.getSummaryReport(query);

    return apiSuccess(report, "Summary report loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
