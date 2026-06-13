// =============================================================================
// Felix Snack POS — Backup & Audit Tab Component
// Phase 11: Owner-only backup export, audit view, and health checks.
// =============================================================================

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Activity,
  ClipboardList,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useAdminExportProducts,
  useAdminExportCategories,
  useAdminExportUsers,
  useAdminExportOrders,
  useAdminExportOrderItems,
  useAdminExportPayments,
  useAdminExportStockMovements,
  useHealthCheck,
  useAudit,
  type AuditOrderLog,
  type AuditPaymentLog,
  type AuditStockMovement,
  type HealthCheckResult,
} from "@/hooks/use-admin";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";

// ---------------------------------------------------------------------------
// Section: Backup Export
// ---------------------------------------------------------------------------

function BackupExportSection() {
  const exportProducts = useAdminExportProducts();
  const exportCategories = useAdminExportCategories();
  const exportUsers = useAdminExportUsers();
  const exportOrders = useAdminExportOrders();
  const exportOrderItems = useAdminExportOrderItems();
  const exportPayments = useAdminExportPayments();
  const exportStockMovements = useAdminExportStockMovements();

  const exportButtons = [
    { label: "Export Products", onClick: () => exportProducts.mutate(), isPending: exportProducts.isPending },
    { label: "Export Categories", onClick: () => exportCategories.mutate(), isPending: exportCategories.isPending },
    { label: "Export Users", onClick: () => exportUsers.mutate(), isPending: exportUsers.isPending },
    { label: "Export Orders", onClick: () => exportOrders.mutate(), isPending: exportOrders.isPending },
    { label: "Export Order Items", onClick: () => exportOrderItems.mutate(), isPending: exportOrderItems.isPending },
    { label: "Export Payments", onClick: () => exportPayments.mutate(), isPending: exportPayments.isPending },
    { label: "Export Stock Movements", onClick: () => exportStockMovements.mutate(), isPending: exportStockMovements.isPending },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Backup Export (CSV)</CardTitle>
        </div>
        <CardDescription>
          Export data to CSV files for manual backup. Each export downloads a
          separate file with all records (including inactive).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {exportButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              size="sm"
              className="gap-2 h-auto py-3 justify-start"
              onClick={btn.onClick}
              disabled={btn.isPending}
            >
              {btn.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              )}
              <span className="text-xs leading-tight text-left">{btn.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Files are downloaded as CSV format compatible with Excel, Google
          Sheets, and other spreadsheet applications.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section: Health Check
// ---------------------------------------------------------------------------

function HealthCheckSection() {
  const { data, isLoading, isError, error, refetch } = useHealthCheck();

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Integrity Health Check</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Running health checks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Integrity Health Check</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Health check failed</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Unable to run health check"}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={handleRefresh}
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const isHealthy = data.status === "healthy";
  const hasWarnings = data.status === "warning";
  const hasErrors = data.status === "error";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Integrity Health Check</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            title="Refresh health check"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Last checked: {formatDate(data.timestamp)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Banner */}
        <Alert variant={hasErrors ? "destructive" : hasWarnings ? "default" : "default"}>
          {isHealthy ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : hasWarnings ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertTitle
            className={
              isHealthy
                ? "text-emerald-700"
                : hasWarnings
                  ? "text-amber-700"
                  : "text-destructive"
            }
          >
            {isHealthy ? "All Checks Passed" : hasWarnings ? "Warnings Found" : "Issues Detected"}
          </AlertTitle>
          <AlertDescription>{data.summary}</AlertDescription>
        </Alert>

        {/* Check Results */}
        <div className="space-y-2">
          {data.checks.map((check) => (
            <div
              key={check.label}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-sm">{check.label}</span>
              <div className="flex items-center gap-2">
                {check.count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {check.count}
                  </Badge>
                )}
                {check.status === "passed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : check.status === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Issues List */}
        {data.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Issues ({data.issues.length})
            </h4>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {data.issues.map((issue, idx) => (
                  <div
                    key={`${issue.type}-${idx}`}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      {issue.severity === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium">
                          {issue.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section: Audit View
// ---------------------------------------------------------------------------

function AuditViewSection() {
  const [auditType, setAuditType] = useState<string>("order_logs");

  const {
    data: auditData,
    isLoading,
    isError,
    error,
  } = useAudit(auditType, 50);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Audit Trail</CardTitle>
        </div>
        <CardDescription>
          Recent activity logs for orders, payments, and stock movements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audit Type Selector */}
        <div className="flex gap-2">
          {[
            { value: "order_logs", label: "Order Logs" },
            { value: "payment_logs", label: "Payment Logs" },
            { value: "stock_movements", label: "Stock Movements" },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={auditType === tab.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setAuditType(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading audit data...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load audit data</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </AlertDescription>
          </Alert>
        ) : !auditData ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit data available.
          </p>
        ) : (
          <>
            {/* Order Logs */}
            {auditType === "order_logs" && auditData.order_logs && (
              <AuditOrderLogsTable logs={auditData.order_logs} />
            )}

            {/* Payment Logs */}
            {auditType === "payment_logs" && auditData.payment_logs && (
              <AuditPaymentLogsTable logs={auditData.payment_logs} />
            )}

            {/* Stock Movements */}
            {auditType === "stock_movements" && auditData.stock_movements && (
              <AuditStockMovementsTable movements={auditData.stock_movements} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Audit Sub-Tables
// ---------------------------------------------------------------------------

function AuditOrderLogsTable({ logs }: { logs: AuditOrderLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No order logs found.
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                #{log.order_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(log.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {log.action}
              </Badge>
              <span className="text-xs text-muted-foreground">
                by {log.user_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function AuditPaymentLogsTable({ logs }: { logs: AuditPaymentLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No payment logs found.
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                #{log.order_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(log.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {log.event}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {log.method} &middot; {formatCurrency(log.amount)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground block mt-0.5">
              by {log.user_name}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function AuditStockMovementsTable({
  movements,
}: {
  movements: AuditStockMovement[];
}) {
  if (movements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No stock movements found.
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-2">
        {movements.map((m) => (
          <div key={m.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{m.product_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(m.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {m.type}
              </Badge>
              <span className="text-xs">
                <span
                  className={
                    m.qty >= 0 ? "text-emerald-600" : "text-destructive"
                  }
                >
                  {m.qty >= 0 ? "+" : ""}
                  {m.qty}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  (stock: {m.stock_before} &rarr; {m.stock_after})
                </span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground block mt-0.5">
              by {m.created_by}
              {m.order_number && ` — Order #${m.order_number}`}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BackupAuditTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Backup & Audit</h2>
        <p className="text-sm text-muted-foreground">
          Export data, view audit trails, and run data integrity checks. All
          actions are owner-only.
        </p>
      </div>

      <Separator />

      {/* Export Section */}
      <BackupExportSection />

      {/* Health Check Section */}
      <HealthCheckSection />

      {/* Audit Section */}
      <AuditViewSection />
    </div>
  );
}
