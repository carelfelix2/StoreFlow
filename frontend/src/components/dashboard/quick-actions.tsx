"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  UserPlus,
  Eye,
  FileBarChart,
  Database,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    label: "Tambah Produk",
    description: "Buat produk baru",
    href: "/products/new",
    icon: Package,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
  },
  {
    label: "Buat User",
    description: "Tambah staff atau kasir",
    href: "/users",
    icon: UserPlus,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  {
    label: "Lihat Kasir",
    description: "Pantau transaksi kasir",
    href: "/cashier",
    icon: Eye,
    color: "text-violet-600",
    bgColor: "bg-violet-50 hover:bg-violet-100",
  },
  {
    label: "Lihat Laporan",
    description: "Analisa penjualan",
    href: "/reports",
    icon: FileBarChart,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
  {
    label: "Backup Data",
    description: "Cadangkan database",
    href: "/settings?tab=backup",
    icon: Database,
    color: "text-rose-600",
    bgColor: "bg-rose-50 hover:bg-rose-100",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link key={action.href} href={action.href} className="block">
              <Button
                variant="outline"
                className={`w-full h-auto justify-start gap-2 p-3 ${action.bgColor} border-0`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white`}>
                  <Icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
