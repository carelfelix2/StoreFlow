"use client";

// =============================================================================
// Felix Snack POS — Settings Page
// Phase 10: Store profile, receipt, printer, payment provider info.
// Phase 11: Backup & Audit tab (owner only).
// Tab-based layout: General settings + User management + Backup & Audit.
// =============================================================================

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserManagementTable } from "@/components/users/user-management-table";
import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { BackupAuditTab } from "@/components/settings/backup-audit-tab";
import { useAuthStore } from "@/store/auth-store";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "owner";

  // Use key prop to remount Tabs when isOwner changes after auth hydration.
  // This avoids the Base UI warning about defaultValue changing after init
  // and avoids the eslint setState-in-effect warning.
  const tabsKey = isOwner ? "owner" : "non-owner";

  return (
    <div className="space-y-4 max-w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          {isOwner
            ? "Atur informasi toko, printer, struk, kelola akun pengguna, dan backup data."
            : "Lihat informasi toko, printer, dan pengaturan struk."}
        </p>
      </div>

      <Tabs key={tabsKey} defaultValue="general">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList variant="default">
            <TabsTrigger value="general">Toko</TabsTrigger>
            {isOwner && <TabsTrigger value="users">Pengguna</TabsTrigger>}
            {isOwner && <TabsTrigger value="backup">Backup & Audit</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">
          <StoreSettingsForm isOwner={isOwner} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="users" className="mt-4">
            <UserManagementTable />
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="backup" className="mt-4">
            <BackupAuditTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
