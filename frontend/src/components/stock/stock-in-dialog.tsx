"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Loader2 } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  stock: number;
  base_unit: string;
}

interface StockInDialogProps {
  /** List of products available for stock-in selection */
  products: ProductOption[];
  /** Submit handler: receives product_id, qty, notes; returns Promise */
  onSubmit: (data: { product_id: string; qty: number; notes: string | null }) => Promise<void>;
}

export function StockInDialog({ products, onSubmit }: StockInDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !qty) return;

    setLoading(true);
    try {
      await onSubmit({
        product_id: productId,
        qty: Number(qty),
        notes: notes || null,
      });
      setOpen(false);
      setProductId("");
      setQty("");
      setNotes("");
    } catch {
      // error toast is handled by the parent mutation hook
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>
          <Plus className="h-4 w-4" />
          Stok Masuk
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Stok</DialogTitle>
          <DialogDescription>
            Tambahkan stok untuk produk yang dipilih.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produk</Label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="">Pilih produk...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock} {p.base_unit})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Jumlah</Label>
            <Input
              id="qty"
              type="number"
              min="0.01"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={`Dalam ${selectedProduct?.base_unit ?? "pcs"}`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Restock dari supplier..."
              rows={2}
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
