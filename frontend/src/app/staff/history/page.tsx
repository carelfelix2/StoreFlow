// =============================================================================
// Felix Snack POS — Staff Order History Page
// Displays the staff user's own orders with status badges.
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/use-orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format-currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StaffHistoryPage() {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useOrders({
    per_page: 50,
  });

  const orders = data?.data ?? [];

  // Empty state
  if (!isLoading && !isError && orders.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Belum Ada Riwayat</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Anda belum mengirimkan pesanan. Mulai buat pesanan baru.
            </p>
          </div>
          <Button
            onClick={() => router.push("/staff/order")}
            className="gap-1.5"
          >
            <ShoppingCart className="h-4 w-4" />
            Buat Pesanan Baru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-7rem)] px-4 pt-4 pb-24">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar pesanan yang telah Anda kirimkan.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium">Gagal memuat riwayat</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Order List */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => {
            const statusLabel =
              ORDER_STATUS_LABELS[order.status] ?? order.status;
            const statusColor =
              ORDER_STATUS_COLORS[order.status] ??
              "bg-gray-100 text-gray-700";

            return (
              <div
                key={order.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                {/* Order number + status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {order.order_number}
                  </span>
                  <Badge className={`${statusColor} border-0 text-xs`}>
                    {statusLabel}
                  </Badge>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {formatDate(order.submitted_at ?? order.created_at)}
                  </span>
                </div>

                {/* Customer */}
                {order.customer_name && (
                  <p className="text-xs text-muted-foreground">
                    Pelanggan: {order.customer_name}
                  </p>
                )}

                {/* Items count + total */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    <span>{order.items.length} item</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {formatCurrency(order.grand_total)}
                  </span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2 mt-1">
                    {`"${order.notes}"`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
