// =============================================================================
// Felix Snack POS — Settings Hooks
// TanStack Query hooks for store settings operations.
// =============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as settingsApi from "@/lib/api/settings";
import type { UpdateStoreSettingInput } from "@/types/settings";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const settingsKeys = {
  all: ["settings"] as const,
  store: () => ["settings", "store"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch current store settings.
 * Accessible by owner and cashier.
 */
export function useStoreSettings() {
  return useQuery({
    queryKey: settingsKeys.store(),
    queryFn: settingsApi.getStoreSettings,
    staleTime: 30_000, // 30 seconds — settings don't change often
  });
}

/**
 * Update store settings.
 * Owner only — backend enforces this.
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoreSettingInput) =>
      settingsApi.updateStoreSettings(data),
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(settingsKeys.store(), data);
      toast.success("Pengaturan toko berhasil disimpan");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan pengaturan");
    },
  });
}
