// =============================================================================
// Felix Snack POS — Payment Report API
// GET /api/reports/payments
// Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Access: owner, cashier
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { paymentReportQuerySchema } from "@/lib/validation/report";
import * as reportService from "@/server/db/services/report-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = paymentReportQuerySchema.parse(rawQuery);

    const report = await reportService.getPaymentReport(query);

    return apiSuccess(report, "Payment report loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
