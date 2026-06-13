"use client";

// =============================================================================
// Felix Snack POS — Edit User Dialog
// Owner-only dialog to edit user name, email, and role.
// =============================================================================

import { useState, useCallback, useEffect } from "react";
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
import { useUpdateUser } from "@/hooks/use-users";
import type { User } from "@/types/user";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  role: z.enum(["owner", "cashier", "staff"], {
    message: "Pilih role",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUser();

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
      role: "cashier",
    },
  });

  const role = watch("role");

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role as FormValues["role"],
      });
    }
  }, [user, reset]);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!user) return;
      try {
        await updateUser.mutateAsync({ id: user.id, ...values });
        onOpenChange(false);
      } catch {
        // Error handled by hook
      }
    },
    [user, updateUser, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!updateUser.isPending) {
      onOpenChange(false);
    }
  }, [updateUser.isPending, onOpenChange]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Ubah data user <strong>{user.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama</Label>
            <Input
              id="edit-name"
              placeholder="Masukkan nama"
              disabled={updateUser.isPending}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="Masukkan email"
              disabled={updateUser.isPending}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={role}
              onValueChange={(val) =>
                setValue("role", val as FormValues["role"], {
                  shouldValidate: true,
                })
              }
              disabled={updateUser.isPending}
            >
              <SelectTrigger id="edit-role">
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
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
