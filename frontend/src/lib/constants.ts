export const APP_NAME = "Felix Snack POS";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu",
  reviewing: "Diproses",
  approved: "Disetujui",
  waiting_payment: "Menunggu Bayar",
  paid: "Dibayar",
  printed: "Tercetak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  voided: "Void",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-700",
  reviewing: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  waiting_payment: "bg-purple-100 text-purple-700",
  paid: "bg-emerald-100 text-emerald-700",
  printed: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  voided: "bg-red-200 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  owner: "Pemilik",
  cashier: "Kasir",
  staff: "Staff",
};

export const STOCK_MOVEMENT_TYPES: Record<string, string> = {
  sale: "Penjualan",
  stock_in: "Stok Masuk",
  adjustment: "Penyesuaian",
  return: "Retur",
  void: "Void",
};
