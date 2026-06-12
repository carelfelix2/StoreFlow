// =============================================================================
// Felix Snack POS — Cashier Order Queue Page
// Displays submitted orders from staff for review/approval before payment.
// Phase 5B: Cash payment dialog for approved orders.
// Phase 6: Receipt preview and browser print for paid orders.
// Phase 7A: QRIS payment dialog for approved orders.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useOrders, useReviewOrder, useApproveOrder, useCancelOrder, useProcessCashPayment, useReceipt, useMarkPrinted } from "@/hooks/use-orders";
import type { OrderResponse, ReceiptResponse } from "@/lib/api/orders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format-currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { Search, X, ChevronLeft, ChevronRight, ShoppingCart, Clock, User, FileText, Package, Wallet, Banknote, Printer, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { QrisPaymentDialog } from "@/components/payments/qris-payment-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusTab {
  key: string;
  label: string;
  status?: string;
}

const STATUS_TABS: StatusTab[] = [
  { key: "active", label: "Aktif", status: "submitted,reviewing,approved" },
  { key: "submitted", label: "Menunggu", status: "submitted" },
  { key: "reviewing", label: "Diproses", status: "reviewing" },
  { key: "approved", label: "Disetujui", status: "approved" },
  { key: "cancelled", label: "Dibatalkan", status: "cancelled" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });
}

// ---------------------------------------------------------------------------
// Order Card Skeleton
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
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Card
// ---------------------------------------------------------------------------

interface OrderCardProps {
  order: OrderResponse;
  onSelect: (order: OrderResponse) => void;
}

function OrderCard({ order, onSelect }: OrderCardProps) {
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700";

  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-2 hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => onSelect(order)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">{order.order_number}</span>
        <Badge className={`${statusColor} border-0 text-xs`}>{statusLabel}</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>{formatDate(order.submitted_at ?? order.created_at)}</span>
      </div>

      {order.customer_name && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>{order.customer_name}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5 shrink-0" />
          <span>{order.items.length} item</span>
        </div>
        <span className="font-semibold text-sm">{formatCurrency(order.grand_total)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cash Payment Dialog
// ---------------------------------------------------------------------------

interface CashPaymentDialogProps {
  order: OrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CashPaymentDialog({ order, open, onOpenChange, onSuccess }: CashPaymentDialogProps) {
  const cashPaymentMutation = useProcessCashPayment();
  const [paidAmount, setPaidAmount] = useState<string>("");

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setPaidAmount("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const handlePaidAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits
      const value = e.target.value.replace(/\D/g, "");
      setPaidAmount(value);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!order) return;

    const paidAmountNum = parseInt(paidAmount, 10);
    if (isNaN(paidAmountNum) || paidAmountNum < order.grand_total) return;

    try {
      await cashPaymentMutation.mutateAsync({
        id: order.id,
        paid_amount: paidAmountNum,
      });
      toast.success(`Pembayaran ${order.order_number} berhasil`);
      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Gagal memproses pembayaran");
    }
  }, [order, paidAmount, cashPaymentMutation, handleOpenChange, onSuccess]);

  if (!order) return null;

  const paidAmountNum = parseInt(paidAmount, 10) || 0;
  const changeAmount = paidAmountNum - order.grand_total;
  const isSufficient = paidAmountNum >= order.grand_total;
  const isPending = cashPaymentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Pembayaran Tunai
          </DialogTitle>
          <DialogDescription>
            {order.order_number} — {order.customer_name ?? "Tanpa pelanggan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Grand Total */}
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Belanja</p>
            <p className="text-2xl font-bold">{formatCurrency(order.grand_total)}</p>
          </div>

          {/* Paid Amount Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Uang Diterima</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={paidAmount}
                onChange={handlePaidAmountChange}
                className="pl-10 text-lg font-semibold"
                autoFocus
              />
            </div>
          </div>

          {/* Change Amount */}
          {paidAmountNum > 0 && (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kembalian</span>
                <span
                  className={`font-semibold ${
                    isSufficient ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {isSufficient
                    ? formatCurrency(changeAmount)
                    : `Kurang ${formatCurrency(Math.abs(changeAmount))}`}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isSufficient || isPending}
          >
            {isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Order Detail Drawer
// ---------------------------------------------------------------------------

interface OrderDetailDrawerProps {
  order: OrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCashPaymentClick: (order: OrderResponse) => void;
  onQrisPaymentClick: (order: OrderResponse) => void;
  onPrintReceiptClick: (order: OrderResponse) => void;
}

function OrderDetailDrawer({ order, open, onOpenChange, onCashPaymentClick, onQrisPaymentClick, onPrintReceiptClick }: OrderDetailDrawerProps) {
  const reviewMutation = useReviewOrder();
  const approveMutation = useApproveOrder();
  const cancelMutation = useCancelOrder();

  const handleReview = useCallback(async () => {
    if (!order) return;
    try {
      await reviewMutation.mutateAsync(order.id);
      toast.success(`Pesanan ${order.order_number} sedang diproses`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal memproses pesanan");
    }
  }, [order, reviewMutation, onOpenChange]);

  const handleApprove = useCallback(async () => {
    if (!order) return;
    try {
      await approveMutation.mutateAsync(order.id);
      toast.success(`Pesanan ${order.order_number} telah disetujui`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyetujui pesanan");
    }
  }, [order, approveMutation, onOpenChange]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    try {
      await cancelMutation.mutateAsync(order.id);
      toast.success(`Pesanan ${order.order_number} telah dibatalkan`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal membatalkan pesanan");
    }
  }, [order, cancelMutation, onOpenChange]);

  const handleCashPayment = useCallback(() => {
    if (!order) return;
    onOpenChange(false);
    onCashPaymentClick(order);
  }, [order, onOpenChange, onCashPaymentClick]);

  const handleQrisPayment = useCallback(() => {
    if (!order) return;
    onOpenChange(false);
    onQrisPaymentClick(order);
  }, [order, onOpenChange, onQrisPaymentClick]);

  const handlePrintReceipt = useCallback(() => {
    if (!order) return;
    onOpenChange(false);
    onPrintReceiptClick(order);
  }, [order, onOpenChange, onPrintReceiptClick]);

  if (!order) return null;

  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700";
  const isPending = reviewMutation.isPending || approveMutation.isPending || cancelMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono">{order.order_number}</SheetTitle>
            <Badge className={`${statusColor} border-0`}>{statusLabel}</Badge>
          </div>
          <SheetDescription>
            {formatDate(order.submitted_at ?? order.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Customer */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Pelanggan
            </h4>
            <p className="text-sm">{order.customer_name ?? "-"}</p>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Catatan
              </h4>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Item Pesanan
            </h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-lg border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.qty} × {item.unit_name} @ {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diskon</span>
                <span className="text-destructive">-{formatCurrency(order.discount_total)}</span>
              </div>
            )}
            {order.tax_total > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pajak</span>
                <span>{formatCurrency(order.tax_total)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-semibold border-t pt-1.5">
              <span>Total</span>
              <span>{formatCurrency(order.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 border-t p-4 space-y-2">
          {order.status === "submitted" && (
            <>
              <Button
                className="w-full"
                onClick={handleReview}
                disabled={isPending}
              >
                {reviewMutation.isPending ? "Memproses..." : "Proses"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleCancel}
                disabled={isPending}
              >
                {cancelMutation.isPending ? "Membatalkan..." : "Batal"}
              </Button>
            </>
          )}

          {order.status === "reviewing" && (
            <>
              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={isPending}
              >
                {approveMutation.isPending ? "Menyetujui..." : "Setujui"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={handleCancel}
                disabled={isPending}
              >
                {cancelMutation.isPending ? "Membatalkan..." : "Batal"}
              </Button>
            </>
          )}

          {order.status === "approved" && (
            <>
              <Button
                className="w-full gap-2"
                onClick={handleCashPayment}
              >
                <Wallet className="h-4 w-4" />
                Bayar Cash
              </Button>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={handleQrisPayment}
              >
                <QrCode className="h-4 w-4" />
                Bayar QRIS
              </Button>
            </>
          )}

          {order.status === "paid" && (
            <>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-sm font-medium text-emerald-700">
                  Pesanan telah dibayar
                </p>
              </div>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={handlePrintReceipt}
              >
                <Printer className="h-4 w-4" />
                Cetak Struk
              </Button>
            </>
          )}

          {order.status === "cancelled" && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-sm font-medium text-red-700">
                Pesanan telah dibatalkan
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Cashier Page
// ---------------------------------------------------------------------------

export default function CashierPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<OrderResponse | null>(null);
  const [qrisDialogOpen, setQrisDialogOpen] = useState(false);
  const [qrisOrder, setQrisOrder] = useState<OrderResponse | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: receiptData, refetch: refetchReceipt } = useReceipt(receiptOrderId);
  const markPrintedMutation = useMarkPrinted();

  const activeTabConfig = STATUS_TABS.find((t) => t.key === activeTab);
  const statusParam = activeTabConfig?.status;

  const { data, isLoading, isError, refetch } = useOrders({
    status: statusParam,
    page,
    per_page: 20,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const handleSelectOrder = useCallback((order: OrderResponse) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  const handleCashPaymentClick = useCallback((order: OrderResponse) => {
    setPaymentOrder(order);
    setPaymentDialogOpen(true);
  }, []);

  const handleQrisPaymentClick = useCallback((order: OrderResponse) => {
    setQrisOrder(order);
    setQrisDialogOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentOrder(null);
    setQrisOrder(null);
    refetch();
  }, [refetch]);

  const handlePrintReceiptClick = useCallback((order: OrderResponse) => {
    setReceiptOrderId(order.id);
    setReceiptPreviewOpen(true);
  }, []);

  const handlePrintSuccess = useCallback(async () => {
    if (!receiptOrderId) return;
    setIsPrinting(true);
    try {
      await markPrintedMutation.mutateAsync(receiptOrderId);
      toast.success("Struk berhasil dicetak");
      refetch();
    } catch {
      toast.error("Gagal memperbarui status cetak");
    } finally {
      setIsPrinting(false);
      setReceiptPreviewOpen(false);
      setReceiptOrderId(null);
    }
  }, [receiptOrderId, markPrintedMutation, refetch]);

  const handleCloseReceiptPreview = useCallback(() => {
    setReceiptPreviewOpen(false);
    setReceiptOrderId(null);
  }, []);

  // Filter by search term
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      (order.customer_name ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="shrink-0 space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Antrian Pesanan</h1>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor pesanan atau pelanggan..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <p className="text-sm">Gagal memuat pesanan</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Muat Ulang
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <ShoppingCart className="h-8 w-8" />
            <p className="text-sm">
              {search
                ? "Pesanan tidak ditemukan"
                : activeTab === "active"
                  ? "Belum ada pesanan aktif"
                  : `Belum ada pesanan dengan status "${activeTabConfig?.label}"`}
            </p>
          </div>
        )}

        {/* Order Cards */}
        {!isLoading &&
          !isError &&
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onSelect={handleSelectOrder} />
          ))}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground">
            Halaman {meta?.current_page ?? 1} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCashPaymentClick={handleCashPaymentClick}
        onQrisPaymentClick={handleQrisPaymentClick}
        onPrintReceiptClick={handlePrintReceiptClick}
      />

      {/* Cash Payment Dialog */}
      <CashPaymentDialog
        order={paymentOrder}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={handlePaymentSuccess}
      />

      {/* QRIS Payment Dialog */}
      <QrisPaymentDialog
        order={qrisOrder}
        open={qrisDialogOpen}
        onOpenChange={setQrisDialogOpen}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt Preview */}
      {receiptPreviewOpen && receiptData && (
        <ReceiptPreview
          receipt={receiptData}
          onClose={handleCloseReceiptPreview}
          onPrintSuccess={handlePrintSuccess}
          isPrinting={isPrinting}
        />
      )}
    </div>
  );
}
