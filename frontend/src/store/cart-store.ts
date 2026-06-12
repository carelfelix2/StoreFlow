// =============================================================================
// Felix Snack POS — Cart Store (Zustand)
// Local cart state for staff order input.
// No database mutations — purely client-side until order submission.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItem {
  /** Product ID */
  product_id: string;
  /** Product name (for display) */
  product_name: string;
  /** Product image URL (for display) */
  image: string | null;
  /** Selected unit name (e.g., "pcs", "box") */
  unit_name: string;
  /** Unit conversion rate to base unit */
  conversion_to_base: number;
  /** Selling price for this unit */
  selling_price: number;
  /** Quantity in the selected unit */
  quantity: number;
  /** Current stock in base unit */
  stock: number;
  /** Product base unit name */
  base_unit: string;
  /** Whether the product is active */
  is_active: boolean;
}

export interface CartState {
  /** Cart items keyed by `${product_id}:${unit_name}` */
  items: Record<string, CartItem>;
  /** Optional customer name */
  customer_name: string;
  /** Optional order notes */
  notes: string;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, unitName: string) => void;
  increaseQty: (productId: string, unitName: string) => void;
  decreaseQty: (productId: string, unitName: string) => void;
  updateQty: (productId: string, unitName: string, qty: number) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;

  // Computed
  getTotalItems: () => number;
  getTotalAmount: () => number;
  getItemCount: (productId: string, unitName: string) => number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKey(productId: string, unitName: string): string {
  return `${productId}:${unitName}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      customer_name: "",
      notes: "",

      // ----- Actions -----

      addItem: (item) => {
        const key = makeKey(item.product_id, item.unit_name);
        set((state) => {
          const existing = state.items[key];
          if (existing) {
            // Increment quantity if already in cart
            return {
              items: {
                ...state.items,
                [key]: {
                  ...existing,
                  quantity: existing.quantity + 1,
                },
              },
            };
          }
          return {
            items: {
              ...state.items,
              [key]: { ...item, quantity: 1 },
            },
          };
        });
      },

      removeItem: (productId, unitName) => {
        const key = makeKey(productId, unitName);
        set((state) => {
          const { [key]: _removed, ...rest } = state.items;
          return { items: rest };
        });
      },

      increaseQty: (productId, unitName) => {
        const key = makeKey(productId, unitName);
        set((state) => {
          const existing = state.items[key];
          if (!existing) return state;
          return {
            items: {
              ...state.items,
              [key]: { ...existing, quantity: existing.quantity + 1 },
            },
          };
        });
      },

      decreaseQty: (productId, unitName) => {
        const key = makeKey(productId, unitName);
        set((state) => {
          const existing = state.items[key];
          if (!existing) return state;
          if (existing.quantity <= 1) {
            // Remove item if quantity would be 0
            const { [key]: _removed, ...rest } = state.items;
            return { items: rest };
          }
          return {
            items: {
              ...state.items,
              [key]: { ...existing, quantity: existing.quantity - 1 },
            },
          };
        });
      },

      updateQty: (productId, unitName, qty) => {
        const key = makeKey(productId, unitName);
        set((state) => {
          if (qty <= 0) {
            const { [key]: _removed, ...rest } = state.items;
            return { items: rest };
          }
          const existing = state.items[key];
          if (!existing) return state;
          return {
            items: {
              ...state.items,
              [key]: { ...existing, quantity: qty },
            },
          };
        });
      },

      clearCart: () => {
        set({ items: {}, customer_name: "", notes: "" });
      },

      setCustomerName: (name) => {
        set({ customer_name: name });
      },

      setNotes: (notes) => {
        set({ notes });
      },

      // ----- Computed -----

      getTotalItems: () => {
        return Object.values(get().items).reduce(
          (sum, item) => sum + item.quantity,
          0
        );
      },

      getTotalAmount: () => {
        return Object.values(get().items).reduce(
          (sum, item) => sum + item.selling_price * item.quantity,
          0
        );
      },

      getItemCount: (productId, unitName) => {
        const key = makeKey(productId, unitName);
        return get().items[key]?.quantity ?? 0;
      },
    }),
    {
      name: "felix-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist items, not computed functions
      partialize: (state) => ({
        items: state.items,
        customer_name: state.customer_name,
        notes: state.notes,
      }),
    }
  )
);
