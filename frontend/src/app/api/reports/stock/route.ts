// =============================================================================
// Felix Snack POS — Stock Report API
// GET /api/reports/stock
// Query: ?search=&low_stock_only=true&page=1&per_page=20
// Access: owner, cashier
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { stockReportQuerySchema } from "@/lib/validation/report";
import * as reportService from "@/server/db/services/report-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = stockReportQuerySchema.parse(rawQuery);

    const report = await reportService.getStockReport(query);

    return apiSuccess(report, "Stock report loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
