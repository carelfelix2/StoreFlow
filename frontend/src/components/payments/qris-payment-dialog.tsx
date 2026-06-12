// =============================================================================
// Felix Snack POS — QRIS Payment Dialog
// Dialog for initiating and monitoring QRIS payments.
// Phase 7A: QRIS Payment Architecture with Mock Provider.
// =============================================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useInitiateQrisPayment, usePaymentStatus, useConfirmMockPaid } from "@/hooks/use-orders";
import type { OrderResponse, QrisPaymentResponse } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format-currency";
import { toast } from "sonner";
import { QrCode, Clock, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QrisPaymentDialogProps {
  order: OrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Countdown Timer Component
// ---------------------------------------------------------------------------

function CountdownTimer({ expiredAt }: { expiredAt: Date }) {
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    function calculate() {
      const now = new Date();
      const diff = new Date(expiredAt).getTime() - now.getTime();

      if (diff <= 0) {
        setRemaining("Kedaluwarsa");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiredAt]);

  return (
    <span className="font-mono text-sm tabular-nums">{remaining}</span>
  );
}

// ---------------------------------------------------------------------------
// QRIS Payment Dialog Component
// ---------------------------------------------------------------------------

export function QrisPaymentDialog({ order, open, onOpenChange, onSuccess }: QrisPaymentDialogProps) {
  const initiateMutation = useInitiateQrisPayment();
  const confirmMockMutation = useConfirmMockPaid();
  const [payment, setPayment] = useState<QrisPaymentResponse | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  // Use the payment status query hook with auto-refresh
  const {
    data: statusData,
    isFetching: isCheckingStatus,
    refetch: refetchStatus,
  } = usePaymentStatus(paymentId);

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPayment(null);
        setIsInitiating(false);
        setPaymentId(null);
        initiatedRef.current = false;
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Initiate QRIS payment when dialog opens — using ref to track initiation
  useEffect(() => {
    if (!open || !order || initiatedRef.current) return;

    initiatedRef.current = true;
    setIsInitiating(true);

    initiateMutation.mutateAsync(order.id)
      .then((result) => {
        setPayment(result);
        setPaymentId(result.payment_id);
        toast.success("Kode QRIS berhasil dibuat");
      })
      .catch(() => {
        toast.error("Gagal membuat pembayaran QRIS");
        handleOpenChange(false);
      })
      .finally(() => {
        setIsInitiating(false);
      });
  }, [open, order, initiateMutation, handleOpenChange]);

  // Watch for status changes — if paid, trigger success
  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (statusData && statusData.status === "paid" && prevStatusRef.current !== "paid") {
      prevStatusRef.current = "paid";
      toast.success("Pembayaran QRIS berhasil dikonfirmasi");
      handleOpenChange(false);
      onSuccess();
    } else if (statusData) {
      prevStatusRef.current = statusData.status;
    }
  }, [statusData, handleOpenChange, onSuccess]);

  const handleCheckStatus = useCallback(() => {
    refetchStatus();
  }, [refetchStatus]);

  const handleSimulatePaid = useCallback(async () => {
    if (!payment) return;

    try {
      await confirmMockMutation.mutateAsync(payment.payment_id);
      toast.success("Pembayaran berhasil (simulasi)");
      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Gagal mensimulasikan pembayaran");
    }
  }, [payment, confirmMockMutation, handleOpenChange, onSuccess]);

  if (!order) return null;

  const isPending = initiateMutation.isPending || isInitiating;
  const isExpired = payment ? new Date(payment.expired_at) < new Date() : false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pembayaran QRIS
          </DialogTitle>
          <DialogDescription>
            {order.order_number} — {order.customer_name ?? "Tanpa pelanggan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Grand Total */}
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Pembayaran</p>
            <p className="text-2xl font-bold">{formatCurrency(order.grand_total)}</p>
          </div>

          {/* Loading State */}
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Membuat kode QRIS...</p>
            </div>
          )}

          {/* Mock QRIS Area */}
          {payment && !isPending && (
            <>
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  {/* Mock QR Code Placeholder */}
                  <div className="flex h-40 w-40 items-center justify-center bg-white">
                    <div className="grid grid-cols-8 gap-0.5">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-3 w-3 rounded-sm ${
                            // Generate a pseudo-random QR-like pattern
                            (i * 7 + i * 3) % 5 === 0 || i % 11 === 0 || (i + 3) % 7 === 0
                              ? "bg-black"
                              : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {payment.gateway_reference}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scan QRIS ini untuk membayar
                </p>
              </div>

              {/* Expiry Countdown */}
              <div className="flex items-center justify-center gap-2 rounded-lg border p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Batas pembayaran: </span>
                <CountdownTimer expiredAt={payment.expired_at} />
              </div>

              {/* Status Check Result */}
              {statusData && (
                <div className={`rounded-lg border p-3 text-center ${
                  statusData.status === "paid"
                    ? "bg-emerald-50 border-emerald-200"
                    : statusData.status === "expired"
                      ? "bg-red-50 border-red-200"
                      : "bg-muted"
                }`}>
                  <p className="text-sm font-medium">
                    {statusData.status === "paid" && (
                      <span className="flex items-center justify-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Pembayaran telah diterima
                      </span>
                    )}
                    {statusData.status === "expired" && (
                      <span className="flex items-center justify-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" />
                        Pembayaran telah kedaluwarsa
                      </span>
                    )}
                    {statusData.status === "pending" && (
                      <span className="text-muted-foreground">
                        Menunggu pembayaran...
                      </span>
                    )}
                    {statusData.status === "failed" && (
                      <span className="flex items-center justify-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" />
                        Pembayaran gagal
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {payment && !isPending && (
            <>
              {/* Cek Status Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus || isExpired}
              >
                <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? "animate-spin" : ""}`} />
                {isCheckingStatus ? "Memeriksa..." : "Cek Status Pembayaran"}
              </Button>

              {/* Simulasikan Sudah Bayar Button (development only) */}
              <Button
                className="w-full gap-2"
                onClick={handleSimulatePaid}
                disabled={confirmMockMutation.isPending || isExpired}
                variant="secondary"
              >
                {confirmMockMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Simulasikan Sudah Bayar
                  </>
                )}
              </Button>
            </>
          )}

          {/* Cancel / Close Button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => handleOpenChange(false)}
            disabled={isPending || confirmMockMutation.isPending}
          >
            {payment ? "Tutup" : "Batal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
