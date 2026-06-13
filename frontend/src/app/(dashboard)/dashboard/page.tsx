// =============================================================================
// Felix Snack POS — Owner Dashboard Page (Server Component)
// Fetches real-time business data from live database.
// Route: /dashboard (owner only — enforced by getDashboardData)
// All data is real — no mock data.
// =============================================================================

import { Suspense } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { TopProductsWidget } from "@/components/dashboard/top-products-widget";
import { LowStockAlertWidget } from "@/components/dashboard/low-stock-alert-widget";
import { RecentOrdersWidget } from "@/components/dashboard/recent-orders-widget";
import { StaffPerformanceWidget } from "@/components/dashboard/staff-performance-widget";
import { PaymentBreakdownWidget } from "@/components/dashboard/payment-breakdown-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getDashboardData } from "@/lib/dashboard-queries";

// ISR: revalidate every 30 seconds for near-real-time data
export const revalidate = 30;

async function DashboardContent() {
  const data = await getDashboardData();

  const { kpis, sales_trend, payment_breakdown, top_products, low_stock_alerts, recent_orders, staff_performance } = data;

  return (
    <div className="space-y-6">
      {/* ---- KPI Cards (8 metrics) ---- */}
      <KpiCards kpis={kpis} />

      {/* ---- Row 2: Sales Trend (2/3) + Payment Breakdown (1/3) ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesTrendChart trend={sales_trend} />
        </div>
        <div>
          <PaymentBreakdownWidget breakdown={payment_breakdown} />
        </div>
      </div>

      {/* ---- Row 3: Top Products (2/3) + Low Stock Alert (1/3) ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TopProductsWidget products={top_products} />
        </div>
        <div>
          <LowStockAlertWidget alerts={low_stock_alerts} />
        </div>
      </div>

      {/* ---- Row 4: Recent Orders (2/3) + Staff Performance (1/3) ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={recent_orders} />
        </div>
        <div>
          <StaffPerformanceWidget staff={staff_performance} />
        </div>
      </div>

      {/* ---- Row 5: Quick Actions ---- */}
      <QuickActions />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview bisnis real-time
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
