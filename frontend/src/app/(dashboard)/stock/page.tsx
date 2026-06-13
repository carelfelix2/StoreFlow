"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockInDialog } from "@/components/stock/stock-in-dialog";
import { StockMovementsTable } from "@/components/stock/stock-movements-table";
import { StockSkeleton } from "@/components/stock/stock-skeleton";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Package,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { useStockList, useStockMovements, useStockIn } from "@/hooks/use-stock";

function StockHeader({
  lowCount,
  outCount,
}: {
  lowCount: number;
  outCount: number;
}) {
  const totalAlerts = lowCount + outCount;

  if (totalAlerts === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            Stok Aman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-600">
            Semua produk memiliki stok yang cukup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Peringatan Stok
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm">
          {outCount > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <XCircle className="h-3.5 w-3.5" />
              {outCount} habis
            </span>
          )}
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowCount} menipis
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ok: { label: "Aman", variant: "default" },
  low: { label: "Menipis", variant: "secondary" },
  out: { label: "Habis", variant: "destructive" },
};

export default function StockPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);

  // Debounce search input to avoid query spamming
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  // TanStack Query: stock list
  const {
    data: stockData,
    isPending: stockLoading,
    isError: stockError,
  } = useStockList({ search: debouncedSearch, page, per_page: 20 });

  // TanStack Query: stock movements
  const {
    data: movementsData,
    isPending: movementsLoading,
  } = useStockMovements({ page: movementsPage, per_page: 10 });

  // TanStack Query: stock-in mutation
  const stockIn = useStockIn();

  const products = stockData?.data ?? [];
  const meta = stockData?.meta ?? null;
  const movements = movementsData?.data ?? [];
  const movementsMeta = movementsData?.meta ?? null;

  const lowCount = products.filter((p) => p.status === "low").length;
  const outCount = products.filter((p) => p.status === "out").length;

  // Initial loading state
  if (stockLoading && products.length === 0) {
    return <StockSkeleton />;
  }

  // Error state
  if (stockError && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Terjadi kesalahan saat mengambil data stok.
        </p>
        <Button onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Stok</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pantau stok dan riwayat pergerakan stok.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <StockInDialog
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
              base_unit: p.base_unit,
            }))}
            onSubmit={async (data) => {
              await stockIn.mutateAsync(data);
            }}
          />
        </div>
      </div>

      {/* Stock Alert Banner */}
      <StockHeader lowCount={lowCount} outCount={outCount} />

      {/* Stock Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">
            Daftar Stok Produk
            {meta && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({meta.total} produk)
              </span>
            )}
          </CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="whitespace-nowrap">Stok</TableHead>
                <TableHead className="whitespace-nowrap">Min. Stok</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : products.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada produk ditemukan
                      </TableCell>
                    </TableRow>
                  )
                  : products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-muted-foreground truncate">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {product.category.name}
                      </TableCell>
                      <TableCell className="font-mono whitespace-nowrap">
                        <span
                          className={
                            product.status === "out"
                              ? "text-red-600"
                              : product.status === "low"
                                ? "text-amber-600"
                                : ""
                          }
                        >
                          {product.stock}
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {product.base_unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {product.min_stock} {product.base_unit}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig[product.status]?.variant ?? "secondary"}
                        >
                          {statusConfig[product.status]?.label ?? product.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Halaman {meta.current_page} dari {meta.last_page}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Movements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            Riwayat Pergerakan Stok
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <StockMovementsTable
            movements={movements}
            loading={movementsLoading}
          />

          {/* Movements Pagination */}
          {movementsMeta && movementsMeta.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Halaman {movementsMeta.current_page} dari{" "}
                {movementsMeta.last_page}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={movementsPage <= 1}
                  onClick={() =>
                    setMovementsPage((p) => Math.max(1, p - 1))
                  }
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={movementsPage >= movementsMeta.last_page}
                  onClick={() => setMovementsPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
