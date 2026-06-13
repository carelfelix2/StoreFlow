// =============================================================================
// Felix Snack POS — Receipt Preview Component
// Displays a thermal receipt preview optimized for 80mm paper.
// Uses window.print() for browser printing.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReceiptResponse } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format-currency";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: id });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReceiptPreviewProps {
  receipt: ReceiptResponse;
  onClose: () => void;
  onPrintSuccess: () => void;
  isPrinting: boolean;
}

// ---------------------------------------------------------------------------
// Receipt Preview Component
// ---------------------------------------------------------------------------

export function ReceiptPreview({
  receipt,
  onClose,
  onPrintSuccess,
  isPrinting,
}: ReceiptPreviewProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const isMountedRef = useRef(true);

  const handlePrint = useCallback(() => {
    // Create a hidden iframe for printing
    const iframe = printFrameRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Build the receipt HTML with print-specific CSS
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk - ${receipt.order_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            width: 72mm;
            padding: 4mm 4mm;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 8px;
          }

          .header .store-name {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }

          .header .store-info {
            font-size: 10px;
            color: #333;
          }

          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }

          .order-info {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .order-info .row {
            display: flex;
            justify-content: space-between;
          }

          .order-info .label {
            color: #555;
          }

          .items-table {
            width: 100%;
            font-size: 11px;
            margin-bottom: 6px;
          }

          .items-table .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2px;
          }

          .items-table .item-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .items-table .item-detail {
            font-size: 10px;
            color: #555;
            margin-left: 4px;
          }

          .items-table .item-subtotal {
            white-space: nowrap;
            text-align: right;
            min-width: 60px;
          }

          .totals {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 1px 0;
          }

          .totals .grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 3px 0;
            margin-top: 2px;
          }

          .payment-info {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .payment-info .row {
            display: flex;
            justify-content: space-between;
          }

          .footer {
            text-align: center;
            font-size: 10px;
            color: #555;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #000;
          }

          .reprint-label {
            text-align: center;
            font-size: 10px;
            color: #888;
            font-style: italic;
            margin-top: 4px;
          }

          @media print {
            body {
              width: 72mm;
              padding: 2mm 4mm;
            }
          }
        </style>
      </head>
      <body>
        <!-- Store Header -->
        <div class="header">
          <div class="store-name">${receipt.store_name}</div>
          ${receipt.store_address ? `<div class="store-info">${receipt.store_address}</div>` : ""}
          ${receipt.store_phone ? `<div class="store-info">Telp: ${receipt.store_phone}</div>` : ""}
        </div>

        <div class="divider"></div>

        <!-- Order Info -->
        <div class="order-info">
          <div class="row">
            <span class="label">No. Pesanan</span>
            <span>${receipt.order_number}</span>
          </div>
          <div class="row">
            <span class="label">Tanggal</span>
            <span>${formatDate(receipt.created_at)}</span>
          </div>
          ${receipt.paid_at ? `
          <div class="row">
            <span class="label">Waktu Bayar</span>
            <span>${formatDate(receipt.paid_at)}</span>
          </div>
          ` : ""}
          ${receipt.cashier_name ? `
          <div class="row">
            <span class="label">Kasir</span>
            <span>${receipt.cashier_name}</span>
          </div>
          ` : ""}
          ${receipt.staff_name ? `
          <div class="row">
            <span class="label">Staff</span>
            <span>${receipt.staff_name}</span>
          </div>
          ` : ""}
          ${receipt.customer_name ? `
          <div class="row">
            <span class="label">Pelanggan</span>
            <span>${receipt.customer_name}</span>
          </div>
          ` : ""}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div class="items-table">
          ${receipt.items.map((item) => `
            <div class="item-row">
              <div>
                <div class="item-name">${item.product_name}</div>
                <div class="item-detail">${item.qty} × ${formatCurrency(item.price)} (${item.unit_name})</div>
              </div>
              <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
            </div>
          `).join("")}
        </div>

        <div class="divider"></div>

        <!-- Totals -->
        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${formatCurrency(receipt.subtotal)}</span>
          </div>
          ${receipt.discount_total > 0 ? `
          <div class="row">
            <span>Diskon</span>
            <span>-${formatCurrency(receipt.discount_total)}</span>
          </div>
          ` : ""}
          ${receipt.tax_total > 0 ? `
          <div class="row">
            <span>Pajak</span>
            <span>${formatCurrency(receipt.tax_total)}</span>
          </div>
          ` : ""}
          <div class="grand-total row">
            <span>TOTAL</span>
            <span>${formatCurrency(receipt.grand_total)}</span>
          </div>
        </div>

        <!-- Payment Info -->
        ${receipt.payment ? `
        <div class="payment-info">
          <div class="row">
            <span class="label">Metode Bayar</span>
            <span>${PAYMENT_METHOD_LABELS[receipt.payment.method] ?? receipt.payment.method}</span>
          </div>
          <div class="row">
            <span class="label">Dibayar</span>
            <span>${formatCurrency(receipt.payment.paid_amount)}</span>
          </div>
          <div class="row">
            <span class="label">Kembalian</span>
            <span>${formatCurrency(receipt.payment.change_amount)}</span>
          </div>
        </div>
        ` : ""}

        <!-- Reprint Label -->
        ${receipt.is_printed ? `<div class="reprint-label">=== REPRINT ===</div>` : ""}

        <!-- Footer -->
        ${receipt.receipt_footer ? `
        <div class="footer">
          ${receipt.receipt_footer}
        </div>
        ` : `
        <div class="footer">
          Terima kasih telah berbelanja<br/>
          Barang yang sudah dibeli tidak dapat ditukar/kembali
        </div>
        `}
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for content to render, then print
    setTimeout(() => {
      if (!isMountedRef.current) return;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // After print dialog closes, notify parent
      // Use a small delay since window.print() is blocking in some browsers
      setTimeout(() => {
        if (isMountedRef.current) {
          onPrintSuccess();
        }
      }, 500);
    }, 300);
  }, [receipt, onPrintSuccess]);

  // Track mounted state for race condition safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-print when component mounts
  useEffect(() => {
    // Small delay to ensure the dialog is rendered
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);

    return () => clearTimeout(timer);
  }, [handlePrint]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            <h2 className="font-semibold text-sm">
              {receipt.is_printed ? "Cetak Ulang Struk" : "Pratinjau Struk"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isPrinting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            id="receipt-preview"
            className="mx-auto bg-white border shadow-sm"
            style={{
              width: "72mm",
              padding: "4mm",
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#000",
            }}
          >
            {/* Store Header */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "2px",
                }}
              >
                {receipt.store_name}
              </div>
              {receipt.store_address && (
                <div style={{ fontSize: "10px", color: "#333" }}>
                  {receipt.store_address}
                </div>
              )}
              {receipt.store_phone && (
                <div style={{ fontSize: "10px", color: "#333" }}>
                  Telp: {receipt.store_phone}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Order Info */}
            <div style={{ fontSize: "11px", marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>No. Pesanan</span>
                <span>{receipt.order_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#555" }}>Tanggal</span>
                <span>{formatDate(receipt.created_at)}</span>
              </div>
              {receipt.paid_at && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Waktu Bayar</span>
                  <span>{formatDate(receipt.paid_at)}</span>
                </div>
              )}
              {receipt.cashier_name && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Kasir</span>
                  <span>{receipt.cashier_name}</span>
                </div>
              )}
              {receipt.staff_name && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Staff</span>
                  <span>{receipt.staff_name}</span>
                </div>
              )}
              {receipt.customer_name && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Pelanggan</span>
                  <span>{receipt.customer_name}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Items */}
            <div style={{ marginBottom: "6px" }}>
              {receipt.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "2px",
                  }}
                >
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: "10px", color: "#555" }}>
                      {item.qty} × {formatCurrency(item.price)} ({item.unit_name})
                    </div>
                  </div>
                  <div
                    style={{
                      whiteSpace: "nowrap",
                      textAlign: "right",
                      minWidth: "60px",
                    }}
                  >
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

            {/* Totals */}
            <div style={{ fontSize: "11px", marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              {receipt.discount_total > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(receipt.discount_total)}</span>
                </div>
              )}
              {receipt.tax_total > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                  <span>Pajak</span>
                  <span>{formatCurrency(receipt.tax_total)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: "bold",
                  borderTop: "1px solid #000",
                  borderBottom: "1px solid #000",
                  padding: "3px 0",
                  marginTop: "2px",
                }}
              >
                <span>TOTAL</span>
                <span>{formatCurrency(receipt.grand_total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            {receipt.payment && (
              <div style={{ fontSize: "11px", marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Metode Bayar</span>
                  <span>{PAYMENT_METHOD_LABELS[receipt.payment.method] ?? receipt.payment.method}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Dibayar</span>
                  <span>{formatCurrency(receipt.payment.paid_amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Kembalian</span>
                  <span>{formatCurrency(receipt.payment.change_amount)}</span>
                </div>
              </div>
            )}

            {/* Reprint Label */}
            {receipt.is_printed && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  color: "#888",
                  fontStyle: "italic",
                  marginTop: "4px",
                }}
              >
                === REPRINT ===
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                fontSize: "10px",
                color: "#555",
                marginTop: "8px",
                paddingTop: "6px",
                borderTop: "1px dashed #000",
              }}
            >
              {receipt.receipt_footer ??
                "Terima kasih telah berbelanja\nBarang yang sudah dibeli tidak dapat ditukar/kembali"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t px-4 py-3 shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPrinting}
          >
            Tutup
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? "Mencetak..." : receipt.is_printed ? "Cetak Ulang" : "Cetak"}
          </Button>
        </div>
      </div>

      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        style={{ position: "absolute", width: 0, height: 0, border: "none" }}
        title="Print Frame"
      />
    </div>
  );
}
