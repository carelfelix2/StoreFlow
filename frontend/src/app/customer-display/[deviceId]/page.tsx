// =============================================================================
// Felix Snack POS — Customer Display Page
// Phase 8: Customer-facing display for second monitor.
// Polls GET /api/customer-display/[deviceId] every 2 seconds.
// =============================================================================

"use client";

import { use } from "react";
import { useCustomerDisplay } from "@/hooks/use-customer-display";
import { formatCurrency } from "@/lib/format-currency";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { CustomerDisplayData } from "@/types/customer-display";
import {
  Store,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Printer,
  Timer,
  Loader2,
} from "lucide-react";

interface Props {
  params: Promise<{ deviceId: string }>;
}

// ---------------------------------------------------------------------------
// Idle State
// ---------------------------------------------------------------------------

function IdleScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Store className="h-16 w-16 text-indigo-600" />
      <h1 className="text-4xl font-bold tracking-tight">{data.store_name}</h1>
      <p className="text-2xl text-gray-500">Selamat Datang</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Viewing Order State
// ---------------------------------------------------------------------------

function ViewingOrderScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <ShoppingCart className="h-8 w-8 text-indigo-600" />
        <div>
          <h2 className="text-3xl font-bold font-mono">{data.order_number}</h2>
          {data.customer_name && (
            <p className="text-lg text-gray-500">{data.customer_name}</p>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-wider">
          Pesanan
        </h3>
        <div className="space-y-1">
          {data.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xl font-medium truncate">{item.product_name}</p>
                <p className="text-base text-gray-500">
                  {item.qty} {item.unit_name} × {formatCurrency(item.price)}
                </p>
              </div>
              <p className="text-xl font-bold shrink-0 ml-4">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">Total</span>
          <span className="text-3xl font-bold text-indigo-700">
            {formatCurrency(data.grand_total)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waiting Payment (Cash) State
// ---------------------------------------------------------------------------

function WaitingPaymentCashScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <CreditCard className="h-8 w-8 text-purple-600" />
        <div>
          <h2 className="text-3xl font-bold font-mono">{data.order_number}</h2>
          <p className="text-lg text-gray-500">Pembayaran Tunai</p>
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-4">
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-6 text-center">
          <p className="text-lg text-purple-600 mb-2">Total Pembayaran</p>
          <p className="text-4xl font-bold text-purple-700">
            {formatCurrency(data.grand_total)}
          </p>
        </div>

        {data.paid_amount != null && data.paid_amount > 0 && (
          <div className="rounded-xl bg-gray-50 border p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xl text-gray-500">Dibayar</span>
              <span className="text-xl font-semibold">
                {formatCurrency(data.paid_amount)}
              </span>
            </div>
            {data.change_amount != null && data.change_amount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xl text-gray-500">Kembalian</span>
                <span className="text-xl font-semibold text-green-600">
                  {formatCurrency(data.change_amount)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-lg text-gray-400 text-center">
        Menunggu konfirmasi pembayaran...
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waiting Payment (QRIS) State
// ---------------------------------------------------------------------------

function WaitingPaymentQrisScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <CreditCard className="h-8 w-8 text-purple-600" />
        <div>
          <h2 className="text-3xl font-bold font-mono">{data.order_number}</h2>
          <p className="text-lg text-gray-500">Pembayaran QRIS</p>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl bg-purple-50 border border-purple-200 p-6 text-center">
        <p className="text-lg text-purple-600 mb-2">Total Pembayaran</p>
        <p className="text-4xl font-bold text-purple-700">
          {formatCurrency(data.grand_total)}
        </p>
      </div>

      {/* QRIS Info / Placeholder */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 text-center space-y-3">
        <Timer className="h-10 w-10 text-blue-500 mx-auto" />
        <p className="text-lg text-blue-600 font-medium">
          Silakan scan QRIS untuk membayar
        </p>
        <p className="text-base text-blue-500">
          {data.qris_expired_at
            ? `Berlaku hingga: ${new Date(data.qris_expired_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
            : "Menunggu pembayaran..."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paid State
// ---------------------------------------------------------------------------

function PaidScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <CheckCircle2 className="h-20 w-20 text-emerald-500" />
      <h2 className="text-4xl font-bold text-emerald-700">
        Pembayaran Berhasil
      </h2>
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-8 py-4">
        <p className="text-3xl font-bold text-emerald-700">
          {formatCurrency(data.grand_total)}
        </p>
      </div>
      <p className="text-2xl text-gray-500">Terima kasih</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Printed State
// ---------------------------------------------------------------------------

function PrintedScreen({ data }: { data: CustomerDisplayData }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <Printer className="h-20 w-20 text-indigo-500" />
      <h2 className="text-4xl font-bold text-indigo-700">
        Transaksi Selesai
      </h2>
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-8 py-4">
        <p className="text-3xl font-bold text-indigo-700">
          {formatCurrency(data.grand_total)}
        </p>
      </div>
      <p className="text-2xl text-gray-500">Terima kasih</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function CustomerDisplayPage({ params }: Props) {
  const { deviceId } = use(params);
  const { data, isLoading, isError } = useCustomerDisplay(deviceId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error / device not found — show idle welcome anyway
  if (isError || !data) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white text-gray-900">
        <Store className="h-16 w-16 text-indigo-600" />
        <h1 className="mt-4 text-4xl font-bold">Felix Snack</h1>
        <p className="mt-4 text-2xl text-gray-500">Selamat Datang</p>
      </div>
    );
  }

  // Render based on state
  const renderScreen = () => {
    switch (data.state) {
      case "idle":
        return <IdleScreen data={data} />;

      case "viewing_order":
        return <ViewingOrderScreen data={data} />;

      case "waiting_payment": {
        if (data.payment_method === "qris") {
          return <WaitingPaymentQrisScreen data={data} />;
        }
        return <WaitingPaymentCashScreen data={data} />;
      }

      case "paid":
        return <PaidScreen data={data} />;

      case "printed":
        return <PrintedScreen data={data} />;

      default:
        return <IdleScreen data={data} />;
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 p-8">
      {renderScreen()}
    </div>
  );
}
