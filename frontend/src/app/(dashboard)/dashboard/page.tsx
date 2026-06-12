// =============================================================================
// Felix Snack POS — Owner Dashboard Page
// Server component: queries Prisma directly for optimal performance.
// All data is real database data — no mock data.
// =============================================================================

import { Suspense } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentOrdersWidget } from "@/components/dashboard/recent-orders-widget";
import { StaffPerformanceWidget } from "@/components/dashboard/staff-performance-widget";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { TopProductsWidget } from "@/components/dashboard/top-products-widget";
import { LowStockAlertWidget } from "@/components/dashboard/low-stock-alert-widget";
import { PaymentBreakdownWidget } from "@/components/dashboard/payment-breakdown-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getDashboardData } from "@/lib/dashboard-queries";

// ISR: revalidate every 30 seconds for near-real-time data
export const revalidate = 30;

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* ---- KPI Cards ---- */}
      <KpiCards kpis={data.kpis} />

      {/* ---- Sales Trend + Top Products ---- */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesTrendChart trend={data.sales_trend} />
        <TopProductsWidget products={data.top_products} />
      </div>

      {/* ---- Payment Breakdown + Quick Actions ---- */}
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentBreakdownWidget breakdown={data.payment_breakdown} />
        <QuickActions />
      </div>

      {/* ---- Recent Orders + Low Stock Alerts ---- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data.recent_orders} />
        </div>
        <LowStockAlertWidget alerts={data.low_stock_alerts} />
      </div>

      {/* ---- Staff Performance ---- */}
      <StaffPerformanceWidget staff={data.staff_performance} />
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
            Ringkasan penjualan dan aktivitas hari ini
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Diperbarui otomatis setiap 30 detik
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
