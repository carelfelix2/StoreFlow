// =============================================================================
// Felix Snack POS — Customer Display Types
// Phase 8: Optional customer-facing display for second monitor.
// =============================================================================

export type CustomerDisplayState =
  | "idle"
  | "viewing_order"
  | "waiting_payment"
  | "paid"
  | "printed";

export interface CustomerDisplayData {
  device_id: string;
  state: CustomerDisplayState;
  order_id: string | null;
  order_number: string | null;
  customer_name: string | null;
  items: CustomerDisplayItem[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  payment_method: string | null;
  paid_amount: number | null;
  change_amount: number | null;
  qris_url: string | null;
  qris_payload: string | null;
  qris_expired_at: string | null;
  store_name: string;
  updated_at: string;
}

export interface CustomerDisplayItem {
  product_name: string;
  qty: number;
  unit_name: string;
  price: number;
  subtotal: number;
}

export interface CustomerDisplaySetOrderRequest {
  order_id: string;
}

export interface CustomerDisplayStateRecord {
  state: CustomerDisplayState;
  order_id: string | null;
  paid_amount: number | null;
  change_amount: number | null;
  updated_at: string;
}
