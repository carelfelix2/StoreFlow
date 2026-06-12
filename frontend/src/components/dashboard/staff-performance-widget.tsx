"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { User, ShoppingCart } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface StaffPerformanceWidgetProps {
  staff: DashboardData["staff_performance"];
}

export function StaffPerformanceWidget({ staff }: StaffPerformanceWidgetProps) {
  if (staff.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Performa Staff Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada aktivitas staff hari ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Performa Staff Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {s.role}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">{s.order_count}</span>
                <span className="text-xs text-muted-foreground">pesanan</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(s.total_sales)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
