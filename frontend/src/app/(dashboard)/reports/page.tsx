// =============================================================================
// Felix Snack POS — Reports Page (Phase 9)
// 5 tabs: Ringkasan, Penjualan, Produk, Stok, Pembayaran
// Date presets, KPI cards, tables with loading/empty/error states, CSV export.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate, formatDateShort, formatTime } from "@/lib/format-date";
import {
  useSummaryReport,
  useSalesReport,
  useProductReport,
  useStockReport,
  usePaymentReport,
} from "@/hooks/use-reports";
import {
  TrendingUp,
  ShoppingCart,
  Banknote,
  QrCode,
  Package,
  AlertTriangle,
  Search,
  X,
  RotateCw,
  Download,
  Calendar,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  SummaryReport,
  SalesReportItem,
  ProductReportItem,
  StockReportItem,
  PaymentReportItem,
  DatePreset,
} from "@/types/report";

// =========================================================================
// Date helpers (Jakarta timezone)
// =========================================================================

const TZ = 7 * 60 * 60 * 1000;

function jakartaToday(): Date {
  const now = Date.now();
  return new Date(Math.floor((now + TZ) / 86400000) * 86400000 - TZ);
}

function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayString(): string {
  return formatISO(jakartaToday());
}

function daysAgoString(n: number): string {
  const t = jakartaToday();
  t.setDate(t.getDate() - n);
  return formatISO(t);
}

function thisMonthStartString(): string {
  const t = jakartaToday();
  t.setDate(1);
  return formatISO(t);
}

// =========================================================================
// Date preset resolution
// =========================================================================

interface DateRange {
  start_date: string;
  end_date: string;
}

function resolvePreset(preset: DatePreset): DateRange {
  const today = todayString();
  switch (preset) {
    case "today":
      return { start_date: today, end_date: today };
    case "yesterday":
      return { start_date: daysAgoString(1), end_date: daysAgoString(1) };
    case "last_7_days":
      return { start_date: daysAgoString(6), end_date: today };
    case "this_month":
      return { start_date: thisMonthStartString(), end_date: today };
    case "custom":
      // handled externally
      return { start_date: daysAgoString(6), end_date: today };
  }
}

// =========================================================================
// CSV Export helper
// =========================================================================

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF"; // BOM for Excel UTF-8
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((r) => r.map(csvEscape).join(","));
  const csv = bom + [headerLine, ...dataLines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getReportDateSuffix(range: DateRange): string {
  const s = range.start_date.replace(/-/g, "");
  const e = range.end_date.replace(/-/g, "");
  return s === e ? s : `${s}_${e}`;
}

// =========================================================================
// Shared date filter bar
// =========================================================================

interface DateFilterProps {
  preset: DatePreset;
  setPreset: (p: DatePreset) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  resolved: DateRange;
}

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "last_7_days", label: "7 Hari Terakhir" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "custom", label: "Kustom" },
];

function DateFilterBar({
  preset,
  setPreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  resolved,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
        {PRESET_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={preset === opt.value ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => setPreset(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {preset === "custom" && (
        <>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36 h-8 text-xs"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36 h-8 text-xs"
            />
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground ml-auto">
        {formatDateShort(resolved.start_date)} – {formatDateShort(resolved.end_date)}
      </p>
    </div>
  );
}

// =========================================================================
// Skeleton components
// =========================================================================

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p>{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="h-3.5 w-3.5 mr-1" />
        Coba Lagi
      </Button>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      <Icon className="mx-auto h-8 w-8 mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

// =========================================================================
// KPI Card individual
// =========================================================================

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  valueColor?: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, iconColor, valueColor }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor ?? ""}`}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Tab: Ringkasan
// =========================================================================

function RingkasanTab({ resolved, onExport }: { resolved: DateRange; onExport: () => void }) {
  const { data, isLoading, isError, refetch } = useSummaryReport(
    resolved.start_date,
    resolved.end_date
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Gagal memuat ringkasan laporan" onRetry={() => refetch()} />;
  }

  if (!data) {
    return <EmptyState icon={FileText} message="Tidak ada data laporan" />;
  }

  const cards: KpiCardProps[] = [
    {
      title: "Total Penjualan",
      value: formatCurrency(data.total_sales),
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      title: "Transaksi",
      value: data.transaction_count.toLocaleString("id-ID"),
      icon: ShoppingCart,
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
    },
    {
      title: "Tunai",
      value: formatCurrency(data.cash_total),
      icon: Banknote,
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    {
      title: "QRIS",
      value: formatCurrency(data.qris_total),
      icon: QrCode,
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-600",
    },
    {
      title: "Laba Kotor",
      value: formatCurrency(data.gross_profit),
      icon: DollarSign,
      iconColor: "text-violet-600",
      valueColor: "text-violet-600",
    },
    {
      title: "Rata-rata Transaksi",
      value: formatCurrency(data.avg_transaction_value),
      icon: TrendingUp,
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Periode: {formatDateShort(resolved.start_date)} – {formatDateShort(resolved.end_date)}
        </p>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

// =========================================================================
// Tab: Penjualan
// =========================================================================

function PenjualanTab({ resolved, onExport }: { resolved: DateRange; onExport: () => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useSalesReport(
    resolved.start_date,
    resolved.end_date,
    page
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Order</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={7} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Gagal memuat laporan penjualan" onRetry={() => refetch()} />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState icon={ShoppingCart} message="Belum ada penjualan pada periode ini" />;
  }

  const paymentMethodLabels: Record<string, string> = {
    cash: "Tunai",
    qris: "QRIS",
  };

  const statusLabels: Record<string, string> = {
    paid: "Lunas",
    printed: "Tercetak",
    completed: "Selesai",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Order</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: SalesReportItem) => (
              <TableRow key={item.order_id}>
                <TableCell className="font-mono text-xs font-medium">
                  {item.order_number}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  <div>{formatDateShort(item.date)}</div>
                  <div className="text-muted-foreground">{formatTime(item.date)}</div>
                </TableCell>
                <TableCell>{item.cashier}</TableCell>
                <TableCell>{item.customer_name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {paymentMethodLabels[item.payment_method] ?? item.payment_method}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {statusLabels[item.status] ?? item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer: totals + pagination + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.transaction_count}</span> transaksi •{" "}
          <span className="font-medium text-foreground">{formatCurrency(data.total_sales)}</span> total
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-8 text-center">{page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.data.length < 20}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Tab: Produk
// =========================================================================

function ProdukTab({ resolved, onExport }: { resolved: DateRange; onExport: () => void }) {
  const [limit, setLimit] = useState("10");

  const { data, isLoading, isError, refetch } = useProductReport(
    resolved.start_date,
    resolved.end_date,
    Number(limit)
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Penjualan</TableHead>
              <TableHead className="text-right">Laba</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={5} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Gagal memuat laporan produk" onRetry={() => refetch()} />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState icon={Package} message="Belum ada penjualan pada periode ini" />;
  }

  const maxQty = Math.max(...data.data.map((p) => p.total_qty), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Tampilkan</label>
        <Select value={limit} onValueChange={(val) => setLimit(val ?? "10")}>
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Penjualan</TableHead>
              <TableHead className="text-right">Laba</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: ProductReportItem, idx: number) => {
              const barPct = (item.total_qty / maxQty) * 100;
              return (
                <TableRow key={item.product_id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-medium">{item.product_name}</span>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/40 transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.total_qty.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_sales)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(item.gross_profit)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {formatDateShort(data.start_date)} – {formatDateShort(data.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              Total: <span className="font-semibold">{formatCurrency(data.total_sales)}</span>
            </span>
            <span>
              Laba:{" "}
              <span className="font-semibold text-emerald-600">
                {formatCurrency(data.total_profit)}
              </span>
            </span>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Tab: Stok
// =========================================================================

function StokTab({ onExport }: { onExport: () => void }) {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useStockReport(
    appliedSearch || undefined,
    lowStockOnly,
    page
  );

  const handleSearch = useCallback(() => {
    setPage(1);
    setAppliedSearch(search);
  }, [search]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Min Stok</TableHead>
              <TableHead className="text-right">Harga Beli</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-right">Nilai Stok</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={7} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Gagal memuat laporan stok" onRetry={() => refetch()} />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState icon={Package} message="Tidak ada data stok" />;
  }

  const totalPages = Math.ceil(data.total / data.per_page);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8 pr-8"
          />
          {appliedSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Cari
        </Button>
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setPage(1);
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          Stok Menipis
        </Button>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Min Stok</TableHead>
              <TableHead className="text-right">Harga Beli</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-right">Nilai Stok</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item: StockReportItem) => {
              const isLow = item.stock <= item.min_stock;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.sku && (
                        <span className="text-xs text-muted-foreground">{item.sku}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={isLow ? "font-semibold text-amber-600" : ""}>
                      {item.stock.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {item.base_unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.min_stock.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.cost_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.selling_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.stock_value)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total.toLocaleString("id-ID")} produk
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const startPage = Math.max(
                1,
                Math.min(page - 2, totalPages - 4)
              );
              const pageNum = startPage + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Tab: Pembayaran
// =========================================================================

function PembayaranTab({ resolved, onExport }: { resolved: DateRange; onExport: () => void }) {
  const { data, isLoading, isError, refetch } = usePaymentReport(
    resolved.start_date,
    resolved.end_date
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Gagal memuat laporan pembayaran" onRetry={() => refetch()} />;
  }

  if (!data || data.data.length === 0) {
    return <EmptyState icon={Banknote} message="Belum ada pembayaran pada periode ini" />;
  }

  const totalAmount = data.total_amount;
  const methodConfig: Record<
    string,
    { label: string; icon: typeof Banknote; color: string; bgColor: string; barColor: string }
  > = {
    cash: {
      label: "Tunai",
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
      barColor: "bg-green-500",
    },
    qris: {
      label: "QRIS",
      icon: QrCode,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
      barColor: "bg-blue-500",
    },
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {data.data.map((item: PaymentReportItem) => {
          const config = methodConfig[item.method] ?? {
            label: item.method.toUpperCase(),
            icon: Banknote,
            color: "text-muted-foreground",
            bgColor: "bg-muted",
            barColor: "bg-muted-foreground",
          };
          const Icon = config.icon;
          const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;

          return (
            <Card key={item.method} className={config.bgColor}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">{formatCurrency(item.total)}</div>
                <div className="space-y-1">
                  <div className="h-3 w-full rounded-full bg-white/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${config.barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.count.toLocaleString("id-ID")} transaksi</span>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {formatDateShort(data.start_date)} – {formatDateShort(data.end_date)}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Total: <span className="font-semibold">{formatCurrency(data.total_amount)}</span>
          </span>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Root Reports Page
// =========================================================================

export default function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>("today");
  const [customStart, setCustomStart] = useState(daysAgoString(6));
  const [customEnd, setCustomEnd] = useState(todayString());

  const resolved: DateRange = useMemo(() => {
    if (preset === "custom") {
      return { start_date: customStart, end_date: customEnd };
    }
    return resolvePreset(preset);
  }, [preset, customStart, customEnd]);

  // Shared preset toggle - when switching to a non-custom preset, update custom dates
  const handlePresetChange = useCallback((p: DatePreset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = resolvePreset(p);
      setCustomStart(r.start_date);
      setCustomEnd(r.end_date);
    }
  }, []);

  const dateSuffix = getReportDateSuffix(resolved);

  const exportSummaryCSV = useCallback(() => {
    // Fetch inline then export — reuse the formatCurrency pattern
    const doExport = async () => {
      try {
        const res = await fetch(
          `/api/reports/summary?start_date=${resolved.start_date}&end_date=${resolved.end_date}`
        );
        const json = await res.json();
        const d: SummaryReport = json.data;
        downloadCSV(
          `storeflow-report-ringkasan-${dateSuffix}.csv`,
          ["Total Penjualan", "Transaksi", "Tunai", "QRIS", "Laba Kotor", "Rata-rata Transaksi"],
          [[
            String(d.total_sales),
            String(d.transaction_count),
            String(d.cash_total),
            String(d.qris_total),
            String(d.gross_profit),
            String(d.avg_transaction_value),
          ]]
        );
      } catch {
        // ignore
      }
    };
    doExport();
  }, [resolved, dateSuffix]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan penjualan, produk, stok, dan pembayaran.
        </p>
      </div>

      {/* Date Filter Bar (shared across tabs) */}
      <DateFilterBar
        preset={preset}
        setPreset={handlePresetChange}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        resolved={resolved}
      />

      <Tabs defaultValue="ringkasan">
        <TabsList variant="default">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="produk">Produk</TabsTrigger>
          <TabsTrigger value="stok">Stok</TabsTrigger>
          <TabsTrigger value="pembayaran">Pembayaran</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4">
          <RingkasanTab resolved={resolved} onExport={exportSummaryCSV} />
        </TabsContent>

        <TabsContent value="penjualan" className="mt-4">
          <PenjualanTab
            resolved={resolved}
            onExport={() => {
              // The PenjualanTab handles export of currently visible data
              // We use a refetch-driven approach: export all pages
              const doExport = async () => {
                try {
                  const allRows: string[][] = [];
                  let page = 1;
                  let hasMore = true;
                  while (hasMore) {
                    const res = await fetch(
                      `/api/reports/sales?start_date=${resolved.start_date}&end_date=${resolved.end_date}&page=${page}&per_page=100`
                    );
                    const json = await res.json();
                    const d = json.data as { data: SalesReportItem[] };
                    if (!d.data || d.data.length === 0) break;
                    for (const item of d.data) {
                      allRows.push([
                        item.order_number,
                        item.date,
                        item.cashier,
                        item.customer_name ?? "",
                        item.payment_method,
                        String(item.total),
                        item.status,
                      ]);
                    }
                    if (d.data.length < 100) hasMore = false;
                    else page++;
                  }
                  downloadCSV(
                    `storeflow-report-penjualan-${dateSuffix}.csv`,
                    ["No. Order", "Tanggal", "Kasir", "Pelanggan", "Metode", "Total", "Status"],
                    allRows
                  );
                } catch {
                  // ignore
                }
              };
              doExport();
            }}
          />
        </TabsContent>

        <TabsContent value="produk" className="mt-4">
          <ProdukTab
            resolved={resolved}
            onExport={() => {
              const doExport = async () => {
                try {
                  const res = await fetch(
                    `/api/reports/products?start_date=${resolved.start_date}&end_date=${resolved.end_date}&limit=50`
                  );
                  const json = await res.json();
                  const d = json.data as { data: ProductReportItem[] };
                  const rows = d.data.map((item) => [
                    item.product_name,
                    String(item.total_qty),
                    String(item.total_sales),
                    String(item.total_cost),
                    String(item.gross_profit),
                  ]);
                  downloadCSV(
                    `storeflow-report-produk-${dateSuffix}.csv`,
                    ["Produk", "Qty", "Penjualan", "HPP", "Laba"],
                    rows
                  );
                } catch {
                  // ignore
                }
              };
              doExport();
            }}
          />
        </TabsContent>

        <TabsContent value="stok" className="mt-4">
          <StokTab
            onExport={() => {
              const doExport = async () => {
                try {
                  const res = await fetch(
                    `/api/reports/stock?per_page=1000`
                  );
                  const json = await res.json();
                  const d = json.data as { data: StockReportItem[] };
                  const rows = d.data.map((item) => [
                    item.name,
                    item.sku ?? "",
                    item.category,
                    String(item.stock),
                    String(item.min_stock),
                    item.base_unit,
                    String(item.cost_price),
                    String(item.selling_price),
                    String(item.stock_value),
                  ]);
                  downloadCSV(
                    `storeflow-report-stok-${dateSuffix}.csv`,
                    ["Produk", "SKU", "Kategori", "Stok", "Min Stok", "Satuan", "Harga Beli", "Harga Jual", "Nilai Stok"],
                    rows
                  );
                } catch {
                  // ignore
                }
              };
              doExport();
            }}
          />
        </TabsContent>

        <TabsContent value="pembayaran" className="mt-4">
          <PembayaranTab
            resolved={resolved}
            onExport={() => {
              const doExport = async () => {
                try {
                  const res = await fetch(
                    `/api/reports/payments?start_date=${resolved.start_date}&end_date=${resolved.end_date}`
                  );
                  const json = await res.json();
                  const d = json.data as { data: PaymentReportItem[] };
                  const rows = d.data.map((item) => [
                    item.method,
                    String(item.count),
                    String(item.total),
                  ]);
                  downloadCSV(
                    `storeflow-report-pembayaran-${dateSuffix}.csv`,
                    ["Metode", "Jumlah Transaksi", "Total"],
                    rows
                  );
                } catch {
                  // ignore
                }
              };
              doExport();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
