// =============================================================================
// Felix Snack POS — Product Report API
// GET /api/reports/products
// Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10
// Access: owner, cashier
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { productReportQuerySchema } from "@/lib/validation/report";
import * as reportService from "@/server/db/services/report-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = productReportQuerySchema.parse(rawQuery);

    const report = await reportService.getProductReport(query);

    return apiSuccess(report, "Product report loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
