// =============================================================================
// Felix Snack POS — Dashboard Types
// =============================================================================

export interface DashboardData {
  kpis: {
    sales_today: number;
    orders_today: number;
    active_products: number;
    low_stock_products: number;
  };
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    grand_total: number;
    items_count: number;
    staff_name: string;
    payment_method: string | null;
    created_at: string;
  }>;
  staff_performance: Array<{
    id: string;
    name: string;
    role: string;
    order_count: number;
    total_sales: number;
  }>;
  sales_trend: Array<{
    date: string;
    total_sales: number;
    order_count: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_qty: number;
    total_sales: number;
  }>;
  low_stock_alerts: Array<{
    id: string;
    name: string;
    stock: number;
    min_stock: number;
    unit: string;
    category: string;
  }>;
  payment_breakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  meta: {
    generated_at: string;
    timezone: string;
  };
}
