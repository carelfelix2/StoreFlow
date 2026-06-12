"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { BarChart3 } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface SalesTrendChartProps {
  trend: DashboardData["sales_trend"];
}

const dayLabels: Record<string, string> = {
  "0": "Min",
  "1": "Sen",
  "2": "Sel",
  "3": "Rab",
  "4": "Kam",
  "5": "Jum",
  "6": "Sab",
};

export function SalesTrendChart({ trend }: SalesTrendChartProps) {
  const maxSales = useMemo(
    () => Math.max(...trend.map((d) => d.total_sales), 1),
    [trend]
  );

  if (trend.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Tren Penjualan 7 Hari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data penjualan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Tren Penjualan 7 Hari
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-[180px]">
          {trend.map((day) => {
            // day.date is a PostgreSQL date string (e.g., "2026-06-12").
            // Parse safely by extracting just the date portion to avoid invalid
            // date strings when the DB returns a timestamp instead.
            const dateStr = day.date.slice(0, 10);
            const [y, m, d] = dateStr.split("-").map(Number);
            const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d));
            const dayOfWeek = dayLabels[String(date.getUTCDay())] ?? "";
            const dayNum = String(date.getUTCDate()).padStart(2, "0");
            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
            const heightPct = maxSales > 0 ? (day.total_sales / maxSales) * 100 : 0;
            const isToday =
              date.toISOString().slice(0, 10) ===
              new Date().toISOString().slice(0, 10);

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(day.total_sales).replace(",00", "")}
                </span>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isToday ? "bg-primary" : "bg-primary/30"
                  }`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${day.date}: ${formatCurrency(day.total_sales)} (${day.order_count} orders)`}
                />
                <span
                  className={`text-xs ${
                    isToday
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {dayOfWeek}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {dayNum}/{month}
                </span>
              </div>
            );
          })}
        </div>
        {/* Summary row */}
        <div className="mt-4 pt-3 border-t flex justify-between text-xs text-muted-foreground">
          <span>
            Total:{" "}
            {formatCurrency(
              trend.reduce((sum, d) => sum + d.total_sales, 0)
            )}
          </span>
          <span>
            Rata-rata:{" "}
            {formatCurrency(
              Math.round(
                trend.reduce((sum, d) => sum + d.total_sales, 0) / trend.length
              )
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
