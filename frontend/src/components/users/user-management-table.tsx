"use client";

// =============================================================================
// Felix Snack POS — User Management Table
// Owner-only: displays user list with actions (edit, reset password, toggle active).
// =============================================================================

import { useState, useCallback } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  KeyRound,
  Power,
  PowerOff,
  Users,
  AlertTriangle,
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { useUsers, useToggleUserActive } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import type { User } from "@/types/user";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 10;

const ROLE_OPTIONS = [
  { value: "", label: "Semua Role" },
  { value: "owner", label: "Pemilik" },
  { value: "cashier", label: "Kasir" },
  { value: "staff", label: "Staff" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
] as const;

// ---------------------------------------------------------------------------
// User Row Skeleton
// ---------------------------------------------------------------------------

function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UserManagementTable() {
  // Auth
  const currentUser = useAuthStore((s) => s.user);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Toggle confirmation
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

  // Queries
  const { data, isLoading, isError, error } = useUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    is_active: statusFilter || undefined,
    page,
    per_page: PER_PAGE,
  });

  // Mutations
  const toggleActive = useToggleUserActive();

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

  const handleOpenEdit = useCallback((user: User) => {
    setEditUser(user);
    setEditOpen(true);
  }, []);

  const handleOpenReset = useCallback((user: User) => {
    setResetUser(user);
    setResetOpen(true);
  }, []);

  const handleToggleClick = useCallback((user: User) => {
    setToggleTarget(user);
    setToggleDialogOpen(true);
  }, []);

  const handleToggleConfirm = useCallback(async () => {
    if (!toggleTarget) return;
    try {
      await toggleActive.mutateAsync(toggleTarget.id);
    } finally {
      setToggleDialogOpen(false);
      setToggleTarget(null);
    }
  }, [toggleTarget, toggleActive]);

  // Derived data
  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manajemen Pengguna</h2>
          <p className="text-sm text-muted-foreground">
            Kelola akun kasir dan staff. Hanya pemilik toko yang dapat mengakses.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama atau email..."
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

        {/* Role filter */}
        <div className="w-36">
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val ?? "");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="w-36">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val ?? "");
              setPage(1);
            }}
          >
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
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading state */}
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <UserRowSkeleton key={i} />
                ))}
              </>
            )}

            {/* Error state */}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm font-medium">Gagal memuat data user</p>
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
            {!isLoading && !isError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm font-medium">Belum ada user</p>
                    <p className="text-xs">
                      {search || roleFilter || statusFilter
                        ? "Tidak ada user yang cocok dengan filter."
                        : "Tambahkan akun kasir atau staff."}
                    </p>
                    {!search && !roleFilter && !statusFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tambah User
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading &&
              !isError &&
              users.map((user) => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Anda)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {USER_ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(user.created_at, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Aksi</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!isSelf && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleOpenReset(user)}
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleClick(user)}
                              >
                                {user.is_active ? (
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
              Menampilkan {users.length} dari {totalItems} user
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

      {/* Create User Dialog */}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editUser}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        user={resetUser}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      {/* Toggle Active Confirmation */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.is_active ? "Nonaktifkan" : "Aktifkan"} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.is_active
                ? `Apakah Anda yakin ingin menonaktifkan "${toggleTarget?.name}"? User yang dinonaktifkan tidak dapat login.`
                : `Apakah Anda yakin ingin mengaktifkan "${toggleTarget?.name}"? User akan dapat login kembali.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.is_active ? "destructive" : "default"}
              disabled={toggleActive.isPending}
              onClick={handleToggleConfirm}
            >
              {toggleActive.isPending
                ? "Memproses..."
                : toggleTarget?.is_active
                  ? "Nonaktifkan"
                  : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
