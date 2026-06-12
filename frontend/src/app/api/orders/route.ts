// =============================================================================
// Felix Snack POS — Orders API Route Handler
// GET  /api/orders — List orders with optional status filter
// POST /api/orders — Create a new order from staff cart
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  apiCreated,
  apiPaginated,
  handleApiError,
  apiValidationError,
} from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validation/order";
import { orderQuerySchema } from "@/lib/validation/order-status";
import * as orderService from "@/server/db/services/order-service";

/**
 * GET /api/orders
 * List orders with optional status filter and pagination.
 *
 * Access:
 *   - Cashier, Owner
 *
 * Query params:
 *   - status: comma-separated list of statuses (e.g. "submitted,reviewing")
 *   - page: page number (default: 1)
 *   - per_page: items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["owner", "cashier"]);

    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = orderQuerySchema.parse(rawQuery);

    const result = await orderService.listOrders({
      status: query.status,
      page: query.page,
      per_page: query.per_page,
    });

    return apiPaginated(
      result.data,
      result.total,
      result.page,
      result.per_page
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/orders
 * Create a new order from the staff cart.
 *
 * Access:
 *   - Staff, Cashier, Owner
 *
 * Body:
 *   - customer_name: string (optional)
 *   - notes: string (optional)
 *   - items: array of { product_id, unit_name, qty }
 *
 * Business rules enforced by service:
 *   - Backend recalculates all prices (never trust frontend)
 *   - Validates products exist and are active
 *   - Validates units exist for products
 *   - Validates stock availability
 *   - Does NOT reduce stock yet (reserved for payment phase)
 *   - Creates order log with STATUS_CHANGED -> submitted
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["owner", "cashier", "staff"]);

    const body = await request.json();

    // Validate request body
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const order = await orderService.createOrderFromCart(parsed.data, user.id);

    return apiCreated(
      order,
      `Order ${order.order_number} created successfully`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
