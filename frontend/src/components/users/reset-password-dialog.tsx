"use client";

// =============================================================================
// Felix Snack POS — Reset Password Dialog
// Owner-only dialog to reset a user's password.
// =============================================================================

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
import { useResetPassword } from "@/hooks/use-users";
import type { User } from "@/types/user";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResetPasswordDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!user) return;
      try {
        await resetPassword.mutateAsync({ id: user.id, ...values });
        reset();
        onOpenChange(false);
      } catch {
        // Error handled by hook
      }
    },
    [user, resetPassword, reset, onOpenChange]
  );

  const handleClose = useCallback(() => {
    if (!resetPassword.isPending) {
      reset();
      onOpenChange(false);
    }
  }, [resetPassword.isPending, reset, onOpenChange]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password untuk <strong>{user.name}</strong>. Password baru
            akan langsung berlaku.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="reset-password">Password Baru</Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                disabled={resetPassword.isPending}
                className="pr-10"
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Sembunyikan" : "Tampilkan"} password
                </span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={resetPassword.isPending}
              variant="default"
            >
              {resetPassword.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Mereset...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
