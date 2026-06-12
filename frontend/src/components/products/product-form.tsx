// =============================================================================
// Felix Snack POS — Product Form Component
// Create/Edit product form using Sheet with multi-unit support.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCategories, useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import type { ProductResponse } from "@/lib/api/products";

// ---------------------------------------------------------------------------
// Form Schema
// ---------------------------------------------------------------------------

const productUnitSchema = z.object({
  unit_name: z.string().min(1, "Unit name is required"),
  conversion_to_base: z.coerce
    .number()
    .positive("Must be greater than 0"),
  selling_price: z.coerce.number().min(0, "Must be 0 or greater"),
  is_default: z.boolean().optional().default(false),
});

const productFormSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Product name is required").max(200),
  sku: z.string().max(50).optional().or(z.literal("")),
  barcode: z.string().max(100).optional().or(z.literal("")),
  base_unit: z.string().min(1, "Base unit is required").max(20),
  cost_price: z.coerce.number().min(0, "Must be 0 or greater"),
  selling_price: z.coerce.number().min(0, "Must be 0 or greater"),
  stock: z.coerce.number().min(0, "Must be 0 or greater").optional().default(0),
  min_stock: z.coerce.number().min(0, "Must be 0 or greater").optional().default(0),
  units: z
    .array(productUnitSchema)
    .min(1, "At least one unit is required"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse | null;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Default Values
// ---------------------------------------------------------------------------

const defaultUnit = {
  unit_name: "pcs",
  conversion_to_base: 1,
  selling_price: 0,
  is_default: true,
};

const defaultValues: ProductFormValues = {
  category_id: "",
  name: "",
  sku: "",
  barcode: "",
  base_unit: "pcs",
  cost_price: 0,
  selling_price: 0,
  stock: 0,
  min_stock: 0,
  units: [defaultUnit],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({ open, onOpenChange, product, onSuccess }: ProductFormProps) {
  const isEditing = !!product;
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [submitting, setSubmitting] = useState(false);

  const categories = categoriesData ?? [];

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units",
  });

  const units = watch("units");

  // Populate form when editing
  useEffect(() => {
    if (product) {
      reset({
        category_id: product.category_id,
        name: product.name,
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        base_unit: product.base_unit,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        stock: product.stock,
        min_stock: product.min_stock,
        units: product.units.map((u) => ({
          unit_name: u.unit_name,
          conversion_to_base: u.conversion_to_base,
          selling_price: u.selling_price,
          is_default: u.is_default,
        })),
      });
    } else {
      reset(defaultValues);
    }
  }, [product, reset]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Ensure exactly one default
      const hasDefault = data.units.some((u) => u.is_default);
      const units = data.units.map((u, i) => ({
        ...u,
        is_default: !hasDefault ? i === 0 : u.is_default,
      }));

      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: {
            category_id: data.category_id,
            name: data.name,
            sku: data.sku || null,
            barcode: data.barcode || null,
            base_unit: data.base_unit,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            stock: data.stock,
            min_stock: data.min_stock,
            units,
          },
        });
      } else {
        await createProduct.mutateAsync({
          category_id: data.category_id,
          name: data.name,
          sku: data.sku || undefined,
          barcode: data.barcode || undefined,
          base_unit: data.base_unit,
          cost_price: data.cost_price,
          selling_price: data.selling_price,
          stock: data.stock,
          min_stock: data.min_stock,
          units,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Produk" : "Tambah Produk"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Ubah detail produk dan satuan."
              : "Masukkan detail produk baru."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 px-4 pb-6">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category_id">Kategori</Label>
            <Select
              value={watch("category_id")}
              onValueChange={(val) => setValue("category_id", val ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input id="name" {...register("name")} placeholder="Nama produk" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} placeholder="SKU (opsional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} placeholder="Barcode (opsional)" />
            </div>
          </div>

          {/* Base Unit */}
          <div className="space-y-2">
            <Label htmlFor="base_unit">Satuan Dasar</Label>
            <Input
              id="base_unit"
              {...register("base_unit")}
              placeholder="pcs"
            />
            {errors.base_unit && (
              <p className="text-xs text-destructive">{errors.base_unit.message}</p>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Harga Modal</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                {...register("cost_price")}
                placeholder="0"
              />
              {errors.cost_price && (
                <p className="text-xs text-destructive">{errors.cost_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">Harga Jual</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                {...register("selling_price")}
                placeholder="0"
              />
              {errors.selling_price && (
                <p className="text-xs text-destructive">{errors.selling_price.message}</p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                step="0.01"
                min="0"
                {...register("stock")}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-xs text-destructive">{errors.stock.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stok Minimum</Label>
              <Input
                id="min_stock"
                type="number"
                step="0.01"
                min="0"
                {...register("min_stock")}
                placeholder="0"
              />
              {errors.min_stock && (
                <p className="text-xs text-destructive">{errors.min_stock.message}</p>
              )}
            </div>
          </div>

          {/* Product Units */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Satuan Produk</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    unit_name: "",
                    conversion_to_base: 1,
                    selling_price: 0,
                    is_default: fields.length === 0,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Satuan
              </Button>
            </div>

            {errors.units?.root && (
              <p className="text-xs text-destructive">{errors.units.root.message}</p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border bg-card p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Satuan #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Default toggle */}
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="default-unit"
                        checked={units[index]?.is_default ?? false}
                        onChange={() => {
                          // Uncheck all, then check this one
                          fields.forEach((_, i) => {
                            setValue(`units.${i}.is_default`, false);
                          });
                          setValue(`units.${index}.is_default`, true);
                        }}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      Default
                    </label>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Satuan</Label>
                    <Input
                      {...register(`units.${index}.unit_name`)}
                      placeholder="pcs"
                      className="h-7 text-sm"
                    />
                    {errors.units?.[index]?.unit_name && (
                      <p className="text-xs text-destructive">
                        {errors.units[index]?.unit_name?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Konversi ke Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`units.${index}.conversion_to_base`)}
                      placeholder="1"
                      className="h-7 text-sm"
                    />
                    {errors.units?.[index]?.conversion_to_base && (
                      <p className="text-xs text-destructive">
                        {errors.units[index]?.conversion_to_base?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Harga Jual Satuan Ini</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`units.${index}.selling_price`)}
                    placeholder="0"
                    className="h-7 text-sm"
                  />
                  {errors.units?.[index]?.selling_price && (
                    <p className="text-xs text-destructive">
                      {errors.units[index]?.selling_price?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || submitting} className="flex-1">
              {isPending || submitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
            <SheetClose
              render={<Button type="button" variant="outline" />}
            >
              Batal
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
