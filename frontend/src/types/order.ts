import type { User } from "./user";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "approved"
  | "waiting_payment"
  | "paid"
  | "printed"
  | "completed"
  | "cancelled"
  | "voided";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_name: string;
  qty: number;
  conversion_to_base: number;
  base_qty: number;
  price: number;
  cost_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  created_by: User;
  cashier_id: string | null;
  cashier: User | null;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  notes: string | null;
  items: OrderItem[];
  submitted_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  unit_name: string;
  conversion_to_base: number;
  price: number;
  qty: number;
  subtotal: number;
}
