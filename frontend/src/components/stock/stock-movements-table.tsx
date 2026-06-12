"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StockMovement {
  id: string;
  product_name: string;
  type: string;
  qty: number;
  unit_name: string | null;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface StockMovementsTableProps {
  movements: StockMovement[];
  loading?: boolean;
}

const typeLabels: Record<string, { label: string; icon: typeof ArrowUp; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sale: { label: "Terjual", icon: ArrowDown, variant: "destructive" },
  stock_in: { label: "Stok Masuk", icon: ArrowUp, variant: "default" },
  adjustment: { label: "Adjustment", icon: Minus, variant: "secondary" },
  return: { label: "Retur", icon: ArrowUp, variant: "outline" },
  void: { label: "Void", icon: ArrowUp, variant: "outline" },
};

export function StockMovementsTable({
  movements,
  loading,
}: StockMovementsTableProps) {
  if (!loading && movements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p>Belum ada riwayat pergerakan stok</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produk</TableHead>
          <TableHead>Tipe</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Stok</TableHead>
          <TableHead>Catatan</TableHead>
          <TableHead>Oleh</TableHead>
          <TableHead>Waktu</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : movements.map((m) => {
              const config = typeLabels[m.type] ?? {
                label: m.type,
                icon: Minus,
                variant: "secondary" as const,
              };
              const Icon = config.icon;
              const isIncrease =
                m.type === "stock_in" || m.type === "return" || m.type === "void";

              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.product_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className="inline-flex gap-1">
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      isIncrease ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    {isIncrease ? "+" : ""}
                    {m.qty} {m.unit_name ?? ""}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">
                      {m.stock_before}
                    </span>{" "}
                    →{" "}
                    <span className="font-medium">{m.stock_after}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                    {m.notes ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs">{m.created_by}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(m.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
      </TableBody>
    </Table>
  );
}
