export type PaymentMethod = "cash" | "qris";

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paid_amount: number;
  change_amount: number;
  gateway_reference: string | null;
  qris_url: string | null;
  expired_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashPaymentRequest {
  paid_amount: number;
}

export interface CashPaymentResponse {
  success: boolean;
  data: {
    payment: Payment;
    receipt: ReceiptData;
  };
  message: string;
}

export interface QrisPaymentRequest {
  amount: number;
}

export interface QrisPaymentResponse {
  success: boolean;
  data: {
    payment: Payment;
    qris_url: string;
    expired_at: string;
  };
  message: string;
}

export interface ReceiptData {
  order_number: string;
  store_name: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  paid_amount: number;
  change_amount: number;
  cashier_name: string;
  created_at: string;
  footer: string;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  subtotal: number;
}
