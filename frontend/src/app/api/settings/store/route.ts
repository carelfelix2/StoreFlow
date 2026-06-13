// =============================================================================
// Felix Snack POS — Store Settings API Route Handler
// GET  /api/settings/store — Get current store settings (cashier+ can view)
// PUT  /api/settings/store — Update store settings (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const updateStoreSettingSchema = z.object({
  store_name: z.string().min(1, "Nama toko wajib diisi").max(100).optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  receipt_footer: z.string().max(500).nullable().optional(),
  logo: z.string().max(500).nullable().optional(),
  printer_type: z.enum(["browser", "thermal_58mm", "thermal_80mm"]).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/settings/store
// ---------------------------------------------------------------------------
// Access:
//   - Owner: full access
//   - Cashier: can view (read-only for UI)
//   - Staff: cannot access
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    const user = await requireRole(["owner", "cashier"]);

    const settings = await prisma.storeSetting.findFirst();

    if (!settings) {
      // If no settings exist, return defaults (singleton should exist from seed)
      return apiSuccess(
        {
          store_name: "Felix Snack",
          address: null,
          phone: null,
          receipt_footer: null,
          logo: null,
          qris_provider: "midtrans",
          printer_type: "browser",
        },
        "Store settings (defaults)"
      );
    }

    return apiSuccess(settings, "Store settings");
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/settings/store
// ---------------------------------------------------------------------------
// Access:
//   - Owner only: can edit settings
//   - Cashier/Staff: 403 Forbidden
//
// Business rules:
//   1. Owner can edit settings
//   2. Cashier can view settings but cannot edit
//   3. Staff cannot access
//   4. StoreSetting is a singleton — upsert to ensure one row exists
//   5. qris_provider is display-only (not editable via this endpoint)
//   6. Receipt uses updated settings (fetched fresh each time)
//   7. Customer display uses updated store name (fetched fresh each time)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["owner"]);

    const body = await request.json();
    const parsed = updateStoreSettingSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, {
        validation: parsed.error.issues.map((i) => i.message),
      });
    }

    const data = parsed.data;

    // Find the existing singleton or create one
    const existing = await prisma.storeSetting.findFirst();

    const updated = await prisma.storeSetting.upsert({
      where: {
        id: existing?.id ?? "default", // will fail for create case, handled below
      },
      update: {
        ...(data.store_name !== undefined && { store_name: data.store_name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.receipt_footer !== undefined && { receipt_footer: data.receipt_footer }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.printer_type !== undefined && { printer_type: data.printer_type }),
      },
      create: {
        store_name: data.store_name ?? "Felix Snack",
        address: data.address ?? null,
        phone: data.phone ?? null,
        receipt_footer: data.receipt_footer ?? null,
        logo: data.logo ?? null,
        qris_provider: "midtrans",
        printer_type: data.printer_type ?? "browser",
      },
    });

    return apiSuccess(updated, "Store settings updated");
  } catch (error) {
    return handleApiError(error);
  }
}
