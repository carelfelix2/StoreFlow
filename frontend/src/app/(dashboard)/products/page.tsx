// =============================================================================
// Felix Snack POS — Products Page
// Full product management UI with table, filters, pagination, and CRUD.
// =============================================================================

"use client";

import { useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Package,
  AlertTriangle,
  Download,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/products/product-form";
import {
  useProducts,
  useCategories,
  useDeleteProduct,
  useToggleProductActive,
  useExportProducts,
  useImportProducts,
} from "@/hooks/use-products";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/lib/format-currency";
import type { ProductResponse } from "@/lib/api/products";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLowStockLabel(stock: number, minStock: number): string | null {
  if (minStock <= 0) return null;
  if (stock <= 0) return "Habis";
  if (stock <= minStock) return "Stok Menipis";
  return null;
}

// ---------------------------------------------------------------------------
// Product Row Skeleton
// ---------------------------------------------------------------------------

function ProductRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  // Auth
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "owner";
  const canMutate = isOwner;

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("true");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Sheet state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // View detail
  const [detailProduct, setDetailProduct] = useState<ProductResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data, isLoading, isError, error } = useProducts({
    search: search || undefined,
    category_id: categoryFilter || undefined,
    is_active: statusFilter || undefined,
    low_stock: lowStockOnly ? "true" : undefined,
    page,
    per_page: PER_PAGE,
  });

  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];

  // Mutations
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();
  const exportProducts = useExportProducts();
  const importProducts = useImportProducts();

  // Handlers
  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingProduct(null);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((product: ProductResponse) => {
    setEditingProduct(product);
    setFormOpen(true);
  }, []);

  const handleOpenDetail = useCallback((product: ProductResponse) => {
    setDetailProduct(product);
    setDetailDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteProduct]);

  const handleToggleActive = useCallback(
    async (product: ProductResponse) => {
      try {
        await toggleActive.mutateAsync(product.id);
      } catch {
        // Error toast handled by hook
      }
    },
    [toggleActive]
  );

  const handleExport = useCallback(async () => {
    try {
      await exportProducts.mutateAsync();
    } catch {
      // Error toast handled by hook
    }
  }, [exportProducts]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await importProducts.mutateAsync(file);
        // Reset filters and page to 1 so newly imported products appear
        setSearch("");
        setSearchInput("");
        setCategoryFilter("");
        setStatusFilter("");
        setLowStockOnly(false);
        setPage(1);
      } catch {
        // Error toast handled by hook
      } finally {
        // Reset file input so the same file can be re-imported
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [importProducts]
  );

  // Derived data
  const products = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.total_pages ?? 1;
  const totalItems = meta?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola produk, kategori, dan satuan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canMutate && (
            <>
              {/* Hidden file input for import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={importProducts.isPending}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {importProducts.isPending ? "Mengimpor..." : "Import"}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportProducts.isPending}
              >
                <Download className="h-4 w-4 mr-1.5" />
                {exportProducts.isPending ? "Mengekspor..." : "Export"}
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Produk
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama, SKU, atau barcode..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-8 pr-8"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          Cari
        </Button>

        {/* Category filter */}
        <div className="w-44">
          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val ?? ""); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="w-36">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val ?? ""); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Low stock toggle */}
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => { setLowStockOnly((v) => !v); setPage(1); }}
          className="gap-1.5"
        >
          <AlertTriangle className="h-4 w-4" />
          Stok Menipis
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Gambar</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Harga Jual</TableHead>
              <TableHead>Harga Modal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Peringatan</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading state */}
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ProductRowSkeleton key={i} />
                ))}
              </>
            )}

            {/* Error state */}
            {isError && (
              <TableRow>
                <TableCell colSpan={11} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm font-medium">Gagal memuat produk</p>
                    <p className="text-xs">{error?.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Empty state */}
            {!isLoading && !isError && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-8 w-8" />
                    <p className="text-sm font-medium">Belum ada produk</p>
                    <p className="text-xs">
                      {search || categoryFilter || statusFilter || lowStockOnly
                        ? "Tidak ada produk yang cocok dengan filter."
                        : "Tambahkan produk pertama Anda."}
                    </p>
                    {canMutate && !search && !categoryFilter && !statusFilter && !lowStockOnly && (
                      <Button variant="outline" size="sm" onClick={handleOpenCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tambah Produk
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading &&
              !isError &&
              products.map((product) => {
                const lowStockLabel = getLowStockLabel(
                  product.stock,
                  product.min_stock
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {product.sku || "—"}
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>
                      <span
                        className={
                          lowStockLabel ? "text-destructive font-medium" : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.base_unit}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.is_active ? "default" : "secondary"}
                      >
                        {product.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lowStockLabel ? (
                        <Badge variant="destructive">{lowStockLabel}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aksi</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleOpenDetail(product)}>
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          {canMutate && (
                            <>
                              <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                                {product.is_active ? (
                                  <>
                                    <PowerOff className="h-3.5 w-3.5 mr-2" />
                                    Nonaktifkan
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-3.5 w-3.5 mr-2" />
                                    Aktifkan
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteTarget(product);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan {products.length} dari {totalItems} produk
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="min-w-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Sheet */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSuccess={() => setPage(1)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{deleteTarget?.name}</strong>? Produk akan dinonaktifkan
              dan tidak akan muncul di daftar produk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteProduct.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <AlertDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{detailProduct?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mt-3 space-y-2 text-left text-sm">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-mono">{detailProduct?.sku || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Barcode</span>
                  <span className="font-mono">{detailProduct?.barcode || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Kategori</span>
                  <span>{detailProduct?.category.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Satuan Dasar</span>
                  <span>{detailProduct?.base_unit}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Harga Modal</span>
                  <span>{formatCurrency(detailProduct?.cost_price ?? 0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Harga Jual</span>
                  <span>{formatCurrency(detailProduct?.selling_price ?? 0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Stok</span>
                  <span>{detailProduct?.stock}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Stok Minimum</span>
                  <span>{detailProduct?.min_stock}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Status</span>
                  <span>
                    <Badge variant={detailProduct?.is_active ? "default" : "secondary"}>
                      {detailProduct?.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </span>
                </div>
                {detailProduct?.units && detailProduct.units.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Satuan Lainnya
                    </p>
                    {detailProduct.units
                      .filter((u) => !u.is_default)
                      .map((u) => (
                        <div key={u.id} className="grid grid-cols-3 gap-1 text-xs">
                          <span>{u.unit_name}</span>
                          <span className="text-muted-foreground">
                            1 = {u.conversion_to_base} {detailProduct.base_unit}
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(u.selling_price)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
            {canMutate && detailProduct && (
              <AlertDialogAction
                variant="default"
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenEdit(detailProduct);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
