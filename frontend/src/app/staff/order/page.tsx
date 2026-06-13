// =============================================================================
// Felix Snack POS — Staff Order Page
// Mobile-first product browsing with local cart state.
// Submits orders via POST /api/orders.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ShoppingCart,
  Package,
  AlertTriangle,
  X,
  ChevronRight,
  MinusIcon,
  PlusIcon,
  Trash2,
  User,
  FileText,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts, useCategories } from "@/hooks/use-products";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/format-currency";
import { toast } from "sonner";
import type { ProductResponse, ProductUnitResponse } from "@/lib/api/products";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 50;

// ---------------------------------------------------------------------------
// Product Card Skeleton
// ---------------------------------------------------------------------------

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit Selector
// ---------------------------------------------------------------------------

function UnitSelector({
  units,
  selectedUnit,
  onSelect,
}: {
  units: ProductUnitResponse[];
  selectedUnit: string;
  onSelect: (unitName: string) => void;
}) {
  if (units.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {units.map((u) => (
        <button
          key={u.unit_name}
          type="button"
          onClick={() => onSelect(u.unit_name)}
          className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
            selectedUnit === u.unit_name
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary"
          }`}
        >
          {u.unit_name}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  onAdd,
}: {
  product: ProductResponse;
  onAdd: (product: ProductResponse, unitName: string) => void;
}) {
  const [selectedUnit, setSelectedUnit] = useState(
    () =>
      product.units.find((u) => u.is_default)?.unit_name ?? product.base_unit
  );

  const currentUnit = useMemo(
    () =>
      product.units.find((u) => u.unit_name === selectedUnit) ??
      product.units[0],
    [product.units, selectedUnit]
  );

  const cartItemCount = useCartStore((s) =>
    s.getItemCount(product.id, selectedUnit)
  );

  const isOutOfStock = product.stock <= 0;
  const isInactive = !product.is_active;
  const disabled = isOutOfStock || isInactive;

  const handleAdd = useCallback(() => {
    if (disabled) return;
    onAdd(product, selectedUnit);
  }, [disabled, onAdd, product, selectedUnit]);

  return (
    <div
      className={`rounded-xl border bg-card p-3 space-y-2 transition-colors ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {/* Product image */}
      {product.image ? (
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square w-full flex items-center justify-center rounded-lg bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Product name & status */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight line-clamp-2 flex-1">
          {product.name}
        </p>
        {isInactive && (
          <Badge variant="secondary" className="shrink-0 text-[10px] h-4">
            Nonaktif
          </Badge>
        )}
      </div>

      {/* Price */}
      <p className="text-base font-bold text-primary">
        {formatCurrency(currentUnit?.selling_price ?? product.selling_price)}
      </p>

      {/* Stock info */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs ${
            isOutOfStock
              ? "text-destructive font-medium"
              : product.stock <= product.min_stock
              ? "text-amber-600 font-medium"
              : "text-muted-foreground"
          }`}
        >
          {isOutOfStock
            ? "Stok Habis"
            : `Stok: ${product.stock} ${product.base_unit}`}
        </span>
      </div>

      {/* Unit selector */}
      <UnitSelector
        units={product.units}
        selectedUnit={selectedUnit}
        onSelect={setSelectedUnit}
      />

      {/* Add button */}
      <div className="flex items-center justify-between pt-1">
        {cartItemCount > 0 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => {
                const store = useCartStore.getState();
                store.decreaseQty(product.id, selectedUnit);
              }}
            >
              <MinusIcon className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium tabular-nums min-w-5 text-center">
              {cartItemCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={handleAdd}
              disabled={disabled}
            >
              <PlusIcon className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tambah
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart Sheet
// ---------------------------------------------------------------------------

function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createOrderMutation = useCreateOrder();

  const items = useCartStore((s) => s.items);
  const customerName = useCartStore((s) => s.customer_name);
  const notes = useCartStore((s) => s.notes);
  const setCustomerName = useCartStore((s) => s.setCustomerName);
  const setNotes = useCartStore((s) => s.setNotes);
  const removeItem = useCartStore((s) => s.removeItem);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);

  const cartItems = Object.values(items);
  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  const handleSendOrder = useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        customer_name: customerName || undefined,
        notes: notes || undefined,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          unit_name: item.unit_name,
          qty: item.quantity,
        })),
      });

      // Clear cart and close sheet
      clearCart();
      onOpenChange(false);

      toast.success(`Pesanan ${order.order_number} berhasil dikirim!`);

      // Redirect to success page
      router.push(`/staff/order-success?id=${order.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim pesanan";
      toast.error(message);
    }
  }, [
    cartItems,
    customerName,
    notes,
    createOrderMutation,
    clearCart,
    onOpenChange,
    router,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Keranjang
            {totalItems > 0 && (
              <Badge variant="default" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {totalItems > 0
              ? `${totalItems} item dipilih`
              : "Keranjang masih kosong"}
          </SheetDescription>
        </SheetHeader>

        {cartItems.length > 0 ? (
          <>
            {/* Cart items */}
            <ScrollArea className="flex-1 px-4 overflow-hidden">
              <div className="space-y-2 pb-4">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product_id}:${item.unit_name}`}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    {/* Product image thumbnail */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="h-10 w-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.unit_name} &times;{" "}
                        {formatCurrency(item.selling_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          decreaseQty(item.product_id, item.unit_name)
                        }
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium tabular-nums min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          increaseQty(item.product_id, item.unit_name)
                        }
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          removeItem(item.product_id, item.unit_name)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Customer & Notes */}
            <div className="px-4 py-3 space-y-3 border-t">
              <div className="space-y-1">
                <Label
                  htmlFor="customer-name"
                  className="text-xs flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  Nama Pelanggan (opsional)
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Masukkan nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="notes"
                  className="text-xs flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Catatan (opsional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan untuk pesanan ini"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Item</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-medium">Total Harga</span>
                <span className="font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="flex-1"
                >
                  Kosongkan
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendOrder}
                  disabled={createOrderMutation.isPending}
                  className="flex-1"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pesanan"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground px-4">
            <ShoppingCart className="h-10 w-10" />
            <p className="text-sm font-medium">Keranjang kosong</p>
            <p className="text-xs text-center">
              Tambahkan produk dari daftar produk.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function StaffOrderPage() {
  // Search & filter
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Cart sheet
  const [cartOpen, setCartOpen] = useState(false);

  // Queries
  const { data, isLoading, isError, error } = useProducts({
    search: search || undefined,
    category_id: categoryFilter || undefined,
    is_active: "true",
    per_page: PER_PAGE,
  });

  const { data: categoriesData } = useCategories();
  const categories = categoriesData ?? [];

  // Cart store
  const addItem = useCartStore((s) => s.addItem);
  const totalCartItems = useCartStore((s) => s.getTotalItems());

  // Products
  const products = data?.data ?? [];

  // Handlers
  const handleSearch = useCallback(() => {
    setSearch(searchInput);
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
  }, []);

  const handleAddProduct = useCallback(
    (product: ProductResponse, unitName: string) => {
      const unit = product.units.find((u) => u.unit_name === unitName);
      if (!unit) return;

      addItem({
        product_id: product.id,
        product_name: product.name,
        image: product.image,
        unit_name: unit.unit_name,
        conversion_to_base: unit.conversion_to_base,
        selling_price: unit.selling_price,
        stock: product.stock,
        base_unit: product.base_unit,
        is_active: product.is_active,
      });

      toast.success(`${product.name} (${unit.unit_name}) ditambahkan`, {
        duration: 1500,
      });
    },
    [addItem]
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 pt-4 pb-24">
      {/* Fixed top: Search + Category chips */}
      <div className="sticky top-0 z-10 bg-background pt-0 pb-3 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari produk..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-8 h-10 text-base rounded-xl"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category chips — horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              !categoryFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">Gagal memuat produk</p>
            <p className="text-xs">{error?.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Package className="h-10 w-10" />
            <p className="text-sm font-medium">
              {search || categoryFilter
                ? "Produk tidak ditemukan"
                : "Belum ada produk aktif"}
            </p>
            <p className="text-xs text-center max-w-[200px]">
              {search || categoryFilter
                ? "Coba ubah kata kunci atau filter kategori."
                : "Minta owner untuk menambahkan produk terlebih dahulu."}
            </p>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAddProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom bar (above mobile bottom nav) */}
      <div className="fixed bottom-14 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 max-w-screen-xl mx-auto gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                  {totalCartItems > 99 ? "99+" : totalCartItems}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {totalCartItems > 0
                  ? `${totalCartItems} item`
                  : "Belum ada item"}
              </p>
              <p className="text-sm font-bold text-primary truncate">
                {formatCurrency(useCartStore.getState().getTotalAmount())}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setCartOpen(true)}
            disabled={totalCartItems === 0}
            size="sm"
            className="gap-1 shrink-0"
          >
            <span className="hidden sm:inline">Lihat Keranjang</span>
            <span className="sm:hidden">Keranjang</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
