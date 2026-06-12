"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface KpiCardsProps {
  kpis: DashboardData["kpis"];
}

const iconMap = {
  sales_today: TrendingUp,
  orders_today: ShoppingCart,
  active_products: Package,
  low_stock_products: AlertTriangle,
} as const;

const kpiConfig: Array<{
  key: keyof DashboardData["kpis"];
  label: string;
  format: "currency" | "number" | "count";
  color: string;
}> = [
  {
    key: "sales_today",
    label: "Penjualan Hari Ini",
    format: "currency",
    color: "text-emerald-600",
  },
  {
    key: "orders_today",
    label: "Transaksi Hari Ini",
    format: "count",
    color: "text-blue-600",
  },
  {
    key: "active_products",
    label: "Produk Aktif",
    format: "number",
    color: "text-violet-600",
  },
  {
    key: "low_stock_products",
    label: "Stok Menipis",
    format: "number",
    color: "text-amber-600",
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map(({ key, label, format, color }) => {
        const Icon = iconMap[key];
        const value = kpis[key];

        const formatted =
          format === "currency"
            ? formatCurrency(value)
            : value.toLocaleString("id-ID");

        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{formatted}</div>
              {key === "low_stock_products" && value > 0 && (
                <p className="text-xs text-amber-500 mt-1">
                  Perlu restock segera
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
