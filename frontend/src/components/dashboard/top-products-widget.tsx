"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { Trophy, Package } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface TopProductsWidgetProps {
  products: DashboardData["top_products"];
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Produk Terlaris Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada penjualan hari ini
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxQty = Math.max(...products.map((p) => p.total_qty), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Produk Terlaris Hari Ini
        </CardTitle>
        <Trophy className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((product, idx) => {
          const barPct = (product.total_qty / maxQty) * 100;

          return (
            <div key={product.product_id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {idx + 1}
                  </span>
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">
                    {product.product_name}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-semibold text-xs">
                    {product.total_qty.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {formatCurrency(product.total_sales)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
