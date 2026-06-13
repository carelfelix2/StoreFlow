// =============================================================================
// Felix Snack POS — Store Settings Types
// Phase 10: Store profile and POS settings types.
// =============================================================================

export interface StoreSetting {
  id: string;
  store_name: string;
  address: string | null;
  phone: string | null;
  receipt_footer: string | null;
  logo: string | null;
  qris_provider: string;
  printer_type: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateStoreSettingInput {
  store_name?: string;
  address?: string | null;
  phone?: string | null;
  receipt_footer?: string | null;
  logo?: string | null;
  printer_type?: string;
}

export const PRINTER_TYPES = [
  { value: "browser", label: "Browser Print" },
  { value: "thermal_58mm", label: "Thermal 58mm" },
  { value: "thermal_80mm", label: "Thermal 80mm" },
] as const;
