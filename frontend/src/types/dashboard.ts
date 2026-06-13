// =============================================================================
// Felix Snack POS — Dashboard Types
// =============================================================================

export interface DashboardKpis {
  /** Total sales (paid orders) today in IDR */
  sales_today: number;
  /** Total sales (paid orders) this month in IDR */
  sales_this_month: number;
  /** Number of orders created today (all statuses) */
  orders_today: number;
  /** Number of orders in non-terminal statuses (draft/submitted/reviewing/approved/waiting_payment) */
  pending_orders: number;
  /** Number of active (is_active) products */
  active_products: number;
  /** Number of active products where stock <= min_stock */
  low_stock_products: number;
  /** Total cash payment amount today */
  cash_total_today: number;
  /** Total QRIS payment amount today */
  qris_total_today: number;
}

export interface RecentOrderItem {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  items_count: number;
  staff_name: string;
  customer_name: string | null;
  payment_method: string | null;
  created_at: string;
}

export interface StaffPerformanceItem {
  id: string;
  name: string;
  role: string;
  order_count: number;
  /** Total value of all orders created by this staff today (all statuses) */
  total_submitted: number;
  /** Total value of paid orders only */
  total_sales: number;
}

export interface SalesTrendItem {
  date: string;
  total_sales: number;
  order_count: number;
}

export interface TopProductItem {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_sales: number;
}

export interface LowStockAlertItem {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
  category: string;
}

export interface PaymentBreakdownItem {
  method: string;
  count: number;
  total: number;
}

export interface DashboardMeta {
  generated_at: string;
  timezone: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  recent_orders: RecentOrderItem[];
  staff_performance: StaffPerformanceItem[];
  sales_trend: SalesTrendItem[];
  top_products: TopProductItem[];
  low_stock_alerts: LowStockAlertItem[];
  payment_breakdown: PaymentBreakdownItem[];
  meta: DashboardMeta;
}
