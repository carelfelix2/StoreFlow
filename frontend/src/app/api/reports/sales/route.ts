// =============================================================================
// Felix Snack POS — Sales Report API
// GET /api/reports/sales
// Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=1&per_page=20
// Access: owner, cashier
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { salesReportQuerySchema } from "@/lib/validation/report";
import * as reportService from "@/server/db/services/report-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = salesReportQuerySchema.parse(rawQuery);

    const report = await reportService.getSalesReport(query);

    return apiSuccess(report, "Sales report loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
