"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format-currency";
import { timeAgo } from "@/lib/format-date";
import { Clock, Banknote, QrCode } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface RecentOrdersWidgetProps {
  orders: DashboardData["recent_orders"];
}

const orderStatusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  reviewing: "Review",
  approved: "Disetujui",
  waiting_payment: "Bayar",
  paid: "Lunas",
  printed: "Tercetak",
  completed: "Selesai",
  cancelled: "Batal",
  voided: "Void",
};

const orderStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "ghost"> = {
  draft: "secondary",
  submitted: "outline",
  reviewing: "outline",
  approved: "outline",
  waiting_payment: "outline",
  paid: "default",
  printed: "default",
  completed: "default",
  cancelled: "destructive",
  voided: "destructive",
};

export function RecentOrdersWidget({ orders }: RecentOrdersWidgetProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pesanan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada pesanan hari ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Pesanan Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium truncate">
                  {order.order_number}
                </span>
                <Badge
                  variant={orderStatusVariants[order.status] ?? "secondary"}
                  className="shrink-0"
                >
                  {orderStatusLabels[order.status] ?? order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{order.staff_name}</span>
                <span>•</span>
                <span>{order.items_count} item</span>
                {order.payment_method && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      {order.payment_method === "cash" ? (
                        <Banknote className="h-3 w-3" />
                      ) : (
                        <QrCode className="h-3 w-3" />
                      )}
                      {order.payment_method.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className="text-sm font-semibold">
                {formatCurrency(order.grand_total)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(order.created_at)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
