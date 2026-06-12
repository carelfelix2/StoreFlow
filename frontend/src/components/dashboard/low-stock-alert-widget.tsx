"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/types/dashboard";

interface LowStockAlertWidgetProps {
  alerts: DashboardData["low_stock_alerts"];
}

export function LowStockAlertWidget({ alerts }: LowStockAlertWidgetProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
          <AlertTriangle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Semua produk aman tersedia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Stok Menipis ({alerts.length})
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 5).map((alert) => {
          const pct = alert.min_stock > 0 ? (alert.stock / alert.min_stock) * 100 : 0;
          const isCritical = alert.stock <= 0;

          return (
            <Link
              key={alert.id}
              href={`/products`}
              className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-2.5 hover:bg-amber-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{alert.name}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.category}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {isCritical ? (
                  <Badge variant="destructive" className="text-xs">
                    Habis
                  </Badge>
                ) : (
                  <Badge
                    variant={pct <= 50 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {alert.stock} / {alert.min_stock} {alert.unit}
                  </Badge>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
        {alerts.length > 5 && (
          <Link
            href="/stock"
            className="text-xs text-muted-foreground hover:text-foreground text-center block pt-1"
          >
            +{alerts.length - 5} produk lainnya
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
