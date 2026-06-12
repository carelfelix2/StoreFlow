// =============================================================================
// Felix Snack POS — Staff Order Success Page
// Displays order details after successful submission.
// Fetches order by ID from query parameter.
// =============================================================================

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
  Package,
  Loader2,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/format-currency";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function StaffOrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  async function handleLogout() {
    try {
      await signOut({ redirect: false });
      useAuthStore.getState().logout();
      toast.success("Berhasil keluar");
      router.push("/login");
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  }

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useOrder(orderId);

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Gagal Memuat Pesanan
          </h1>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat memuat detail pesanan."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/staff/order")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pesanan
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <OrderDetailSkeleton />
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Pesanan Terkirim!
          </h1>
          <p className="text-sm text-muted-foreground">
            Pesanan Anda telah dikirim ke kasir untuk diproses.
          </p>
        </div>

        {/* Order info card */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              No. Pesanan
            </span>
            <span className="text-sm font-semibold font-mono">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
              {order.status === "submitted" ? "Menunggu Konfirmasi" : order.status}
            </span>
          </div>
          {order.customer_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pelanggan
              </span>
              <span className="text-sm font-medium">
                {order.customer_name}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Waktu
            </span>
            <span className="text-sm">
              {new Date(order.submitted_at ?? order.created_at).toLocaleString(
                "id-ID",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          </div>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Item Pesanan
          </h2>
          <div className="rounded-lg border bg-card divide-y">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.qty} {item.unit_name} &times;{" "}
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="text-sm font-medium ml-3 shrink-0">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Diskon</span>
              <span className="text-destructive">
                -{formatCurrency(order.discount_total)}
              </span>
            </div>
          )}
          {order.tax_total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pajak</span>
              <span>{formatCurrency(order.tax_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-primary">
              {formatCurrency(order.grand_total)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => router.push("/staff/order")}
          >
            <ShoppingCart className="h-4 w-4" />
            Pesanan Baru
          </Button>
          <Button
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}
