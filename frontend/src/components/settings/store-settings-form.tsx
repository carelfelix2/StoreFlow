// =============================================================================
// Felix Snack POS — Store Settings Form Component
// Phase 10: Allows owner to configure store profile and POS settings from UI.
// Cashier sees read-only view.
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Store,
  ReceiptText,
  Printer,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/use-settings";
import { PRINTER_TYPES } from "@/types/settings";

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const storeSettingsSchema = z.object({
  store_name: z.string().min(1, "Nama toko wajib diisi").max(100),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  receipt_footer: z.string().max(500).nullable().optional(),
  logo: z.string().max(500).nullable().optional(),
  printer_type: z.enum(["browser", "thermal_58mm", "thermal_80mm"]),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((section) => (
        <Card key={section}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Store Settings Form
// ---------------------------------------------------------------------------

interface StoreSettingsFormProps {
  isOwner: boolean;
}

export function StoreSettingsForm({ isOwner }: StoreSettingsFormProps) {
  const { data: settings, isLoading, isError, error } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      store_name: "Felix Snack",
      address: "",
      phone: "",
      receipt_footer: "",
      logo: "",
      printer_type: "browser",
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        store_name: settings.store_name ?? "Felix Snack",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        receipt_footer: settings.receipt_footer ?? "",
        logo: settings.logo ?? "",
        printer_type: (settings.printer_type as StoreSettingsFormValues["printer_type"]) ?? "browser",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: StoreSettingsFormValues) => {
    updateMutation.mutate({
      store_name: data.store_name,
      address: data.address || null,
      phone: data.phone || null,
      receipt_footer: data.receipt_footer || null,
      logo: data.logo || null,
      printer_type: data.printer_type,
    });
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <FormSkeleton />;
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Gagal memuat pengaturan: {error instanceof Error ? error.message : "Kesalahan tidak diketahui"}
        </AlertDescription>
      </Alert>
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* ================================================================== */}
      {/* Store Profile Section */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profil Toko</CardTitle>
          </div>
          <CardDescription>
            Informasi dasar toko yang akan muncul di struk dan tampilan pelanggan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">Nama Toko *</Label>
            <Input
              id="store_name"
              {...form.register("store_name")}
              placeholder="Nama toko"
              disabled={!isOwner}
            />
            {form.formState.errors.store_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.store_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="Alamat toko (opsional)"
              rows={2}
              disabled={!isOwner}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="0812-xxxx-xxxx"
              disabled={!isOwner}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">URL Logo</Label>
            <Input
              id="logo"
              {...form.register("logo")}
              placeholder="https://example.com/logo.png"
              disabled={!isOwner}
            />
            <p className="text-xs text-muted-foreground">
              URL gambar logo toko (opsional). Belum digunakan saat ini — disiapkan untuk masa depan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Receipt Section */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Pengaturan Struk</CardTitle>
          </div>
          <CardDescription>
            Footer struk yang muncul di bagian bawah setiap struk belanja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt_footer">Footer Struk</Label>
            <Textarea
              id="receipt_footer"
              {...form.register("receipt_footer")}
              placeholder="Terima kasih telah berbelanja&#10;Barang yang sudah dibeli tidak dapat ditukar/kembali"
              rows={3}
              disabled={!isOwner}
            />
            <p className="text-xs text-muted-foreground">
              Teks ini akan muncul di bagian bawah struk. Kosongkan untuk menggunakan default.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Printer Section */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Pengaturan Printer</CardTitle>
          </div>
          <CardDescription>
            Pilih jenis printer yang digunakan untuk mencetak struk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printer_type">Tipe Printer</Label>
            {isOwner ? (
              <Select
                value={form.watch("printer_type")}
                onValueChange={(value) =>
                  form.setValue("printer_type", value as StoreSettingsFormValues["printer_type"])
                }
              >
                <SelectTrigger id="printer_type" className="w-full max-w-xs">
                  <SelectValue placeholder="Pilih tipe printer" />
                </SelectTrigger>
                <SelectContent>
                  {PRINTER_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={
                  PRINTER_TYPES.find((pt) => pt.value === form.watch("printer_type"))?.label ??
                  form.watch("printer_type")
                }
                disabled
                className="w-full max-w-xs"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Saat ini hanya Browser Print yang didukung penuh. Thermal printer akan datang.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Payment Provider Info Section (Display Only) */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Informasi Provider Pembayaran</CardTitle>
          </div>
          <CardDescription>
            Provider QRIS yang sedang aktif. Tidak dapat diubah melalui halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Provider QRIS Aktif</Label>
            <Input
              value={(() => {
                const providerMap: Record<string, string> = {
                  midtrans: "Midtrans",
                  xendit: "Xendit",
                  duitku: "Duitku",
                  mock: "Mock (Development)",
                };
                return settings
                  ? (providerMap[settings.qris_provider] ?? settings.qris_provider)
                  : "-";
              })()}
              disabled
              className="w-full max-w-xs bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Provider pembayaran dikonfigurasi melalui environment variable.
              Hubungi administrator sistem untuk mengubahnya.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Save Button */}
      {/* ================================================================== */}
      {isOwner && (
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !form.formState.isDirty}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
          {!form.formState.isDirty && (
            <p className="text-sm text-muted-foreground">
              Tidak ada perubahan
            </p>
          )}
        </div>
      )}
    </form>
  );
}
