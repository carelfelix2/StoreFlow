// =============================================================================
// Felix Snack POS — Settings API Client
// Client-side functions for store settings API calls.
// =============================================================================

import { apiGet, apiPut } from "@/lib/api";
import type { StoreSetting, UpdateStoreSettingInput } from "@/types/settings";

/**
 * Get the current store settings.
 * GET /api/settings/store
 */
export async function getStoreSettings(): Promise<StoreSetting> {
  return apiGet<StoreSetting>("/settings/store");
}

/**
 * Update store settings.
 * PUT /api/settings/store
 */
export async function updateStoreSettings(
  data: UpdateStoreSettingInput
): Promise<StoreSetting> {
  return apiPut<StoreSetting>("/settings/store", data);
}
