"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { Banknote, QrCode, CreditCard } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

interface PaymentBreakdownWidgetProps {
  breakdown: DashboardData["payment_breakdown"];
}

const methodConfig: Record<
  string,
  { label: string; icon: typeof Banknote; color: string; bgColor: string }
> = {
  cash: {
    label: "Cash",
    icon: Banknote,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  qris: {
    label: "QRIS",
    icon: QrCode,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
};

export function PaymentBreakdownWidget({
  breakdown,
}: PaymentBreakdownWidgetProps) {
  const totalPayments = breakdown.reduce((sum, p) => sum + p.total, 0);

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada pembayaran hari ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Metode Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdown.map((pb) => {
          const config = methodConfig[pb.method] ?? {
            label: pb.method.toUpperCase(),
            icon: CreditCard,
            color: "text-muted-foreground",
            bgColor: "bg-muted",
          };
          const Icon = config.icon;
          const percentage =
            totalPayments > 0 ? (pb.total / totalPayments) * 100 : 0;

          return (
            <div
              key={pb.method}
              className={`rounded-lg border p-3 ${config.bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <span className="text-sm font-bold">
                  {formatCurrency(pb.total)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-white/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pb.method === "cash" ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pb.count} transaksi</span>
                  <span>{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
