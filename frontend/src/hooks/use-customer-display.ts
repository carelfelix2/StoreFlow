// =============================================================================
// Felix Snack POS — Customer Display Hooks
// TanStack Query hooks for customer display operations.
// =============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as displayApi from "@/lib/api/customer-display";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const displayKeys = {
  all: ["customer-display"] as const,
  device: (deviceId: string) => ["customer-display", deviceId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Poll the customer display state for a device every 2 seconds.
 * Used by the customer display page.
 */
export function useCustomerDisplay(deviceId: string) {
  return useQuery({
    queryKey: displayKeys.device(deviceId),
    queryFn: () => displayApi.getDisplayData(deviceId),
    refetchInterval: 2000, // Poll every 2 seconds
    // Keep polling even when window is not focused (important for second monitor)
    refetchIntervalInBackground: true,
    // Don't retry on 404 — device may not exist yet
    retry: false,
  });
}

/**
 * Set the active order for a customer display device.
 */
export function useSetDisplayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceId,
      orderId,
    }: {
      deviceId: string;
      orderId: string;
    }) => displayApi.setDisplayOrder(deviceId, { order_id: orderId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: displayKeys.device(variables.deviceId),
      });
    },
  });
}

/**
 * Clear the customer display for a device.
 */
export function useClearDisplay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => displayApi.clearDisplay(deviceId),
    onSuccess: (_data, deviceId) => {
      queryClient.invalidateQueries({
        queryKey: displayKeys.device(deviceId),
      });
    },
  });
}
