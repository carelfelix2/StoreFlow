"use client";

// =============================================================================
// Felix Snack POS — Create User Dialog
// Owner-only dialog to create a new user account.
// =============================================================================

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/use-users";
import { USER_ROLE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["owner", "cashier", "staff"], {
    message: "Pilih role",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "cashier",
    },
  });

  const role = watch("role");

  const onSubmit = useCallback(
    async (values: FormValues) => {
      try {
        await createUser.mutateAsync(values);
        reset();
        onOpenChange(false);
      } catch {
        // Error handled by hook
      }
    },
    [createUser, reset, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!createUser.isPending) {
      reset();
      onOpenChange(false);
    }
  }, [createUser.isPending, reset, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat User Baru</DialogTitle>
          <DialogDescription>
            Buat akun untuk kasir atau staff. Hanya pemilik toko yang dapat membuat akun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              placeholder="Masukkan nama"
              disabled={createUser.isPending}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Masukkan email"
              disabled={createUser.isPending}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              disabled={createUser.isPending}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(val) =>
                setValue("role", val as FormValues["role"], {
                  shouldValidate: true,
                })
              }
              disabled={createUser.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Pemilik</SelectItem>
                <SelectItem value="cashier">Kasir</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Membuat...
                </>
              ) : (
                "Buat User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
