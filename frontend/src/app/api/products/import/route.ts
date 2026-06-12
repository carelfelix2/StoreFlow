// =============================================================================
// Felix Snack POS — Product Import API Route
// POST /api/products/import — Import products from CSV (owner only)
// =============================================================================

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/products/import
 * Import products from a CSV file upload.
 *
 * Access:
 *   - Owner only
 *
 * Request: multipart/form-data with a "file" field containing the CSV.
 *
 * CSV Columns (matching export format):
 *   name, category_name, sku, barcode, base_unit, cost_price, selling_price,
 *   stock, min_stock, is_active, units_json
 *
 * units_json: JSON stringified array of { unit_name, conversion_to_base, selling_price, is_default }
 *
 * Behavior:
 *   - If a product with the same SKU exists, it will be updated.
 *   - If no SKU is provided, a new product is always created.
 *   - Categories are matched by name; if a category doesn't exist, it's created.
 *   - Returns a summary of created, updated, skipped, and failed rows.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(["owner"]);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, message: "File is required" },
        { status: 400 }
      );
    }

    // Read and parse CSV
    let csvText = await file.text();

    // Strip BOM (Byte Order Mark) if present — exported CSVs include \uFEFF for Excel compatibility
    if (csvText.charCodeAt(0) === 0xfeff) {
      csvText = csvText.slice(1);
    }

    // Normalize line endings (handle Windows \r\n and old Mac \r)
    csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = csvText.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length < 2) {
      return Response.json(
        { success: false, message: "CSV file must have a header row and at least one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const headers = parseCsvLine(lines[0]);
    const requiredColumns = ["name", "cost_price", "selling_price"];
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );

    if (missingColumns.length > 0) {
      return Response.json(
        {
          success: false,
          message: `CSV is missing required columns: ${missingColumns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse data rows
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    // Process each row
    const summary = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      try {
        const record = rowToRecord(headers, row);

        // Validate required fields
        if (!record.name || !record.name.trim()) {
          summary.skipped++;
          summary.errors.push(`Row ${rowNum}: name is required`);
          continue;
        }

        const costPrice = parseFloat(record.cost_price);
        const sellingPrice = parseFloat(record.selling_price);

        if (isNaN(costPrice) || costPrice < 0) {
          summary.skipped++;
          summary.errors.push(`Row ${rowNum}: invalid cost_price "${record.cost_price}"`);
          continue;
        }

        if (isNaN(sellingPrice) || sellingPrice < 0) {
          summary.skipped++;
          summary.errors.push(`Row ${rowNum}: invalid selling_price "${record.selling_price}"`);
          continue;
        }

        // Find or create category by name
        const categoryName = record.category_name?.trim() || "Uncategorized";
        const category = await findOrCreateCategory(categoryName);

        // Parse units
        let units: Array<{
          unit_name: string;
          conversion_to_base: number;
          selling_price: number;
          is_default: boolean;
        }> = [];

        if (record.units_json) {
          try {
            const parsedUnits = JSON.parse(record.units_json);
            if (Array.isArray(parsedUnits) && parsedUnits.length > 0) {
              units = parsedUnits.map((u: Record<string, unknown>) => ({
                unit_name: String(u.unit_name || record.base_unit || "pcs"),
                conversion_to_base: Number(u.conversion_to_base) || 1,
                selling_price: Number(u.selling_price) || sellingPrice,
                is_default: Boolean(u.is_default),
              }));
            }
          } catch {
            // Invalid JSON, fall back to default unit
          }
        }

        // If no units parsed, create a default one
        if (units.length === 0) {
          units = [
            {
              unit_name: record.base_unit?.trim() || "pcs",
              conversion_to_base: 1,
              selling_price: sellingPrice,
              is_default: true,
            },
          ];
        }

        // Ensure exactly one default unit
        const hasDefault = units.some((u) => u.is_default);
        if (!hasDefault) {
          units[0].is_default = true;
        }

        // Parse optional fields
        const stock = parseFloat(record.stock) || 0;
        const minStock = parseFloat(record.min_stock) || 0;
        const isActive = record.is_active === "true" || record.is_active === "1";
        const baseUnit = record.base_unit?.trim() || "pcs";
        const sku = record.sku?.trim() || undefined;
        const barcode = record.barcode?.trim() || undefined;

        // Check if product with this SKU already exists
        if (sku) {
          const existingProduct = await prisma.product.findUnique({
            where: { sku },
          });

          if (existingProduct) {
            // Update existing product
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                category_id: category.id,
                name: record.name.trim(),
                barcode: barcode || null,
                image: null,
                base_unit: baseUnit,
                cost_price: costPrice,
                selling_price: sellingPrice,
                stock: stock,
                min_stock: minStock,
                is_active: isActive,
              },
            });

            // Replace units
            await prisma.productUnit.deleteMany({
              where: { product_id: existingProduct.id },
            });

            await prisma.productUnit.createMany({
              data: units.map((u) => ({
                product_id: existingProduct.id,
                unit_name: u.unit_name,
                conversion_to_base: u.conversion_to_base,
                selling_price: u.selling_price,
                is_default: u.is_default,
              })),
            });

            summary.updated++;
            continue;
          }
        }

        // Create new product
        await prisma.product.create({
          data: {
            category_id: category.id,
            name: record.name.trim(),
            sku: sku || null,
            barcode: barcode || null,
            base_unit: baseUnit,
            cost_price: costPrice,
            selling_price: sellingPrice,
            stock: stock,
            min_stock: minStock,
            is_active: isActive,
            units: {
              create: units.map((u) => ({
                unit_name: u.unit_name,
                conversion_to_base: u.conversion_to_base,
                selling_price: u.selling_price,
                is_default: u.is_default,
              })),
            },
          },
        });

        summary.created++;
      } catch (err) {
        summary.failed++;
        const message = err instanceof Error ? err.message : "Unknown error";
        summary.errors.push(`Row ${rowNum}: ${message}`);
      }
    }

    return apiSuccess(summary, "Import completed");
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a single CSV line into an array of fields, handling quoted values.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Convert header array and row array into a record object.
 */
function rowToRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    record[headers[i].trim()] = row[i]?.trim() ?? "";
  }
  return record;
}

/**
 * Find a category by name, or create it if it doesn't exist.
 */
async function findOrCreateCategory(
  name: string
): Promise<{ id: string; name: string }> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let category = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        slug,
        is_active: true,
      },
    });
  }

  return { id: category.id, name: category.name };
}
