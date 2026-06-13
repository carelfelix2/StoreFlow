// =============================================================================
// Felix Snack POS — Report Types
// =============================================================================

export interface SummaryReport {
  date: string;
  total_sales: number;
  transaction_count: number;
  cash_total: number;
  qris_total: number;
  gross_profit: number;
  avg_transaction_value: number;
}

export interface SalesReportItem {
  order_id: string;
  order_number: string;
  date: string;
  cashier: string;
  customer_name: string | null;
  payment_method: string;
  total: number;
  status: string;
}

export interface SalesReport {
  data: SalesReportItem[];
  start_date: string;
  end_date: string;
  total_sales: number;
  transaction_count: number;
}

export interface ProductReportItem {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_sales: number;
  total_cost: number;
  gross_profit: number;
}

export interface ProductReport {
  data: ProductReportItem[];
  start_date: string;
  end_date: string;
  total_sales: number;
  total_profit: number;
}

export interface StockReportItem {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  min_stock: number;
  base_unit: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_value: number;
}

export interface StockReport {
  data: StockReportItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaymentReportItem {
  method: string;
  count: number;
  total: number;
}

export interface PaymentReport {
  data: PaymentReportItem[];
  start_date: string;
  end_date: string;
  total_amount: number;
}

// ---------------------------------------------------------------------------
// Date filter preset
// ---------------------------------------------------------------------------

export type DatePreset = "today" | "yesterday" | "last_7_days" | "this_month" | "custom";

export interface DateRange {
  start_date: string;
  end_date: string;
}
