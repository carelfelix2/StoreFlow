import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  paymentDialogOpen: boolean;
  paymentDialogType: "cash" | "qris" | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openPaymentDialog: (type: "cash" | "qris") => void;
  closePaymentDialog: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  paymentDialogOpen: false,
  paymentDialogType: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openPaymentDialog: (type) =>
    set({ paymentDialogOpen: true, paymentDialogType: type }),
  closePaymentDialog: () =>
    set({ paymentDialogOpen: false, paymentDialogType: null }),
}));
