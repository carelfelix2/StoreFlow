// =============================================================================
// Felix Snack POS — Customer Display State Manager
// In-memory store for customer display state. Each deviceId maps to a
// CustomerDisplayStateRecord. This is intentionally not persisted to DB —
// customer display state is ephemeral by design (restart = all displays reset).
// =============================================================================

import type {
  CustomerDisplayState,
  CustomerDisplayStateRecord,
} from "@/types/customer-display";

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const displayStates = new Map<string, CustomerDisplayStateRecord>();

// ---------------------------------------------------------------------------
// Default State
// ---------------------------------------------------------------------------

function defaultState(): CustomerDisplayStateRecord {
  return {
    state: "idle",
    order_id: null,
    paid_amount: null,
    change_amount: null,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the current display state for a device.
 * If no state exists, returns a default "idle" state.
 */
export function getDisplayState(
  deviceId: string
): CustomerDisplayStateRecord {
  const existing = displayStates.get(deviceId);
  if (existing) return existing;

  const def = defaultState();
  displayStates.set(deviceId, def);
  return def;
}

/**
 * Set the display state for a device to "viewing_order" or "waiting_payment",
 * optionally with cash payment details.
 */
export function setDisplayState(
  deviceId: string,
  state: CustomerDisplayState,
  orderId: string | null = null
): CustomerDisplayStateRecord {
  const current = getDisplayState(deviceId);

  const updated: CustomerDisplayStateRecord = {
    state,
    order_id: orderId ?? current.order_id,
    paid_amount: current.paid_amount,
    change_amount: current.change_amount,
    updated_at: new Date().toISOString(),
  };

  displayStates.set(deviceId, updated);
  return updated;
}

/**
 * Set the display state to "paid" with payment details.
 */
export function setDisplayPaid(
  deviceId: string,
  orderId: string,
  paidAmount: number,
  changeAmount: number
): CustomerDisplayStateRecord {
  const updated: CustomerDisplayStateRecord = {
    state: "paid",
    order_id: orderId,
    paid_amount: paidAmount,
    change_amount: changeAmount,
    updated_at: new Date().toISOString(),
  };

  displayStates.set(deviceId, updated);
  return updated;
}

/**
 * Set the display state to "printed".
 */
export function setDisplayPrinted(
  deviceId: string,
  orderId: string
): CustomerDisplayStateRecord {
  const updated: CustomerDisplayStateRecord = {
    state: "printed",
    order_id: orderId,
    paid_amount: displayStates.get(deviceId)?.paid_amount ?? null,
    change_amount: displayStates.get(deviceId)?.change_amount ?? null,
    updated_at: new Date().toISOString(),
  };

  displayStates.set(deviceId, updated);
  return updated;
}

/**
 * Clear the display for a device — returns to idle.
 */
export function clearDisplayState(deviceId: string): CustomerDisplayStateRecord {
  const def = defaultState();
  displayStates.set(deviceId, def);
  return def;
}

/**
 * Get all display states (for debugging/admin).
 */
export function getAllDisplayStates(): Map<string, CustomerDisplayStateRecord> {
  return displayStates;
}
