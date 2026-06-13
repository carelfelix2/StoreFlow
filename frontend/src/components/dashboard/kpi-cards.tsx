// =============================================================================
// Felix Snack POS — KPI Cards Widget
// Displays 8 key business metrics in a responsive card grid.
// All values come from live database data via the dashboard API.
// =============================================================================

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format-currency";
import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Banknote,
  QrCode,
} from "lucide-react";
import type { DashboardKpis } from "@/types/dashboard";

interface KpiCardsProps {
  kpis: DashboardKpis | undefined;
  isLoading?: boolean;
}

interface KpiCardConfig {
  label: string;
  field: keyof DashboardKpis;
  icon: LucideIcon;
  format: "currency" | "number";
  color: string;
  bgColor: string;
  iconColor: string;
}

const kpiConfig: KpiCardConfig[] = [
  {
    label: "Penjualan Hari Ini",
    field: "sales_today",
    icon: DollarSign,
    format: "currency",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Penjualan Bulan Ini",
    field: "sales_this_month",
    icon: TrendingUp,
    format: "currency",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Pesanan Hari Ini",
    field: "orders_today",
    icon: ShoppingCart,
    format: "number",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Pesanan Tertunda",
    field: "pending_orders",
    icon: Clock,
    format: "number",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Produk Aktif",
    field: "active_products",
    icon: Package,
    format: "number",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    label: "Stok Menipis",
    field: "low_stock_products",
    icon: AlertTriangle,
    format: "number",
    color: "text-red-700",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    label: "Tunai Hari Ini",
    field: "cash_total_today",
    icon: Banknote,
    format: "currency",
    color: "text-green-700",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    label: "QRIS Hari Ini",
    field: "qris_total_today",
    icon: QrCode,
    format: "currency",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {kpiConfig.map((config) => {
        const value = kpis[config.field];
        const Icon = config.icon;

        return (
          <Card key={config.field} className={config.bgColor}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {config.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className={`text-lg font-bold ${config.color}`}>
                {config.format === "currency"
                  ? formatCurrency(value as number)
                  : (value as number).toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
