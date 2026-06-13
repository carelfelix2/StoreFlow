// =============================================================================
// Felix Snack POS — Customer Display API Client
// Client-side functions for customer display API calls.
// =============================================================================

import api, { apiGet, apiPost } from "@/lib/api";
import type {
  CustomerDisplayData,
  CustomerDisplaySetOrderRequest,
  CustomerDisplayStateRecord,
} from "@/types/customer-display";

/**
 * Poll the current display state for a device.
 * GET /api/customer-display/[deviceId]
 */
export async function getDisplayData(
  deviceId: string
): Promise<CustomerDisplayData> {
  return apiGet<CustomerDisplayData>(`/customer-display/${deviceId}`);
}

/**
 * Set the active order for a customer display device.
 * POST /api/customer-display/[deviceId]/set-order
 */
export async function setDisplayOrder(
  deviceId: string,
  data: CustomerDisplaySetOrderRequest
): Promise<CustomerDisplayStateRecord> {
  return apiPost<CustomerDisplayStateRecord>(
    `/customer-display/${deviceId}/set-order`,
    data
  );
}

/**
 * Clear the customer display for a device.
 * POST /api/customer-display/[deviceId]/clear
 */
export async function clearDisplay(
  deviceId: string
): Promise<CustomerDisplayStateRecord> {
  return apiPost<CustomerDisplayStateRecord>(
    `/customer-display/${deviceId}/clear`
  );
}
