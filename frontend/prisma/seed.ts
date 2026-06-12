// =============================================================================
// Felix Snack POS — Database Seed
// Seeds: Users (owner, cashier, staff), Categories, Products, Store Settings
// =============================================================================

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // ---------------------------------------------------------------------------
  // 1. USERS
  // ---------------------------------------------------------------------------
  const hashedPassword = await bcrypt.hash("password", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@felixsnack.com" },
    update: {},
    create: {
      name: "Owner Felix",
      email: "owner@felixsnack.com",
      password: hashedPassword,
      role: "owner",
      emailVerified: null,
    },
  });
  console.log("  ✅ Owner:", owner.email);

  const cashier = await prisma.user.upsert({
    where: { email: "kasir@felixsnack.com" },
    update: {},
    create: {
      name: "Kasir 1",
      email: "kasir@felixsnack.com",
      password: hashedPassword,
      role: "cashier",
      emailVerified: null,
    },
  });
  console.log("  ✅ Kasir:", cashier.email);

  const staff1 = await prisma.user.upsert({
    where: { email: "staff1@felixsnack.com" },
    update: {},
    create: {
      name: "Staff 1",
      email: "staff1@felixsnack.com",
      password: hashedPassword,
      role: "staff",
      emailVerified: null,
    },
  });
  console.log("  ✅ Staff 1:", staff1.email);

  const staff2 = await prisma.user.upsert({
    where: { email: "staff2@felixsnack.com" },
    update: {},
    create: {
      name: "Staff 2",
      email: "staff2@felixsnack.com",
      password: hashedPassword,
      role: "staff",
      emailVerified: null,
    },
  });
  console.log("  ✅ Staff 2:", staff2.email);

  // ---------------------------------------------------------------------------
  // 2. CATEGORIES
  // ---------------------------------------------------------------------------
  const snack = await prisma.category.upsert({
    where: { slug: "snack" },
    update: {},
    create: {
      name: "Snack",
      slug: "snack",
      color: "#f97316",
      icon: "cookie",
    },
  });
  console.log("  ✅ Category: Snack");

  const permen = await prisma.category.upsert({
    where: { slug: "permen" },
    update: {},
    create: {
      name: "Permen",
      slug: "permen",
      color: "#ec4899",
      icon: "candy",
    },
  });
  console.log("  ✅ Category: Permen");

  const wafer = await prisma.category.upsert({
    where: { slug: "wafer" },
    update: {},
    create: {
      name: "Wafer",
      slug: "wafer",
      color: "#eab308",
      icon: "layers",
    },
  });
  console.log("  ✅ Category: Wafer");

  const minuman = await prisma.category.upsert({
    where: { slug: "minuman" },
    update: {},
    create: {
      name: "Minuman",
      slug: "minuman",
      color: "#06b6d4",
      icon: "cup-soda",
    },
  });
  console.log("  ✅ Category: Minuman");

  // ---------------------------------------------------------------------------
  // 3. PRODUCTS (with units)
  // ---------------------------------------------------------------------------

  // Snack products
  const chikiBalls = await prisma.product.upsert({
    where: { sku: "SNK-001" },
    update: {},
    create: {
      name: "Chiki Balls",
      sku: "SNK-001",
      category_id: snack.id,
      base_unit: "pcs",
      cost_price: 500,
      selling_price: 1000,
      stock: 200,
      min_stock: 20,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 1000, is_default: true },
          { unit_name: "renteng", conversion_to_base: 10, selling_price: 9500 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Chiki Balls");

  const chitato = await prisma.product.upsert({
    where: { sku: "SNK-002" },
    update: {},
    create: {
      name: "Chitato",
      sku: "SNK-002",
      category_id: snack.id,
      base_unit: "pcs",
      cost_price: 1500,
      selling_price: 3000,
      stock: 150,
      min_stock: 15,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 3000, is_default: true },
          { unit_name: "dus", conversion_to_base: 40, selling_price: 110000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Chitato");

  const nabati = await prisma.product.upsert({
    where: { sku: "SNK-003" },
    update: {},
    create: {
      name: "Nabati Wafer",
      sku: "SNK-003",
      category_id: snack.id,
      base_unit: "pcs",
      cost_price: 1000,
      selling_price: 2000,
      stock: 180,
      min_stock: 25,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 2000, is_default: true },
          { unit_name: "renteng", conversion_to_base: 10, selling_price: 19000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Nabati Wafer");

  // Permen products
  const kopiko = await prisma.product.upsert({
    where: { sku: "PRM-001" },
    update: {},
    create: {
      name: "Kopiko",
      sku: "PRM-001",
      category_id: permen.id,
      base_unit: "pcs",
      cost_price: 300,
      selling_price: 500,
      stock: 500,
      min_stock: 50,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 500, is_default: true },
          { unit_name: "renteng", conversion_to_base: 20, selling_price: 9000 },
          { unit_name: "dus", conversion_to_base: 120, selling_price: 50000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Kopiko");

  const relaxa = await prisma.product.upsert({
    where: { sku: "PRM-002" },
    update: {},
    create: {
      name: "Relaxa",
      sku: "PRM-002",
      category_id: permen.id,
      base_unit: "pcs",
      cost_price: 400,
      selling_price: 1000,
      stock: 300,
      min_stock: 30,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 1000, is_default: true },
          { unit_name: "renteng", conversion_to_base: 12, selling_price: 11000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Relaxa");

  // Wafer products
  const tango = await prisma.product.upsert({
    where: { sku: "WFR-001" },
    update: {},
    create: {
      name: "Tango",
      sku: "WFR-001",
      category_id: wafer.id,
      base_unit: "pcs",
      cost_price: 1200,
      selling_price: 2500,
      stock: 120,
      min_stock: 15,
      units: {
        create: [
          { unit_name: "pcs", conversion_to_base: 1, selling_price: 2500, is_default: true },
          { unit_name: "dus", conversion_to_base: 24, selling_price: 55000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Tango");

  // Minuman products
  const aqua600 = await prisma.product.upsert({
    where: { sku: "MNM-001" },
    update: {},
    create: {
      name: "Aqua 600ml",
      sku: "MNM-001",
      category_id: minuman.id,
      base_unit: "btl",
      cost_price: 2000,
      selling_price: 3500,
      stock: 100,
      min_stock: 10,
      units: {
        create: [
          { unit_name: "btl", conversion_to_base: 1, selling_price: 3500, is_default: true },
          { unit_name: "dus", conversion_to_base: 24, selling_price: 78000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Aqua 600ml");

  const tehGelas = await prisma.product.upsert({
    where: { sku: "MNM-002" },
    update: {},
    create: {
      name: "Teh Gelas",
      sku: "MNM-002",
      category_id: minuman.id,
      base_unit: "cup",
      cost_price: 500,
      selling_price: 1000,
      stock: 300,
      min_stock: 30,
      units: {
        create: [
          { unit_name: "cup", conversion_to_base: 1, selling_price: 1000, is_default: true },
          { unit_name: "dus", conversion_to_base: 48, selling_price: 43000 },
        ],
      },
    },
  });
  console.log("  ✅ Product: Teh Gelas");

  // ---------------------------------------------------------------------------
  // 4. STORE SETTINGS
  // ---------------------------------------------------------------------------
  const settingsCount = await prisma.storeSetting.count();
  if (settingsCount === 0) {
    await prisma.storeSetting.create({
      data: {
        store_name: "Felix Snack",
        address: "Jl. Raya Utama No. 123, Jakarta",
        phone: "0812-3456-7890",
        receipt_footer: "Terima kasih telah belanja di Felix Snack!\nBarang yang sudah dibeli tidak dapat dikembalikan.",
        qris_provider: "midtrans",
        printer_type: "browser",
      },
    });
    console.log("  ✅ Store Settings created");
  } else {
    console.log("  ⏭  Store Settings already exists");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n🌱 Seed complete!");
  console.log("   Users:      4 (owner, cashier, 2 staff)");
  console.log("   Categories: 4 (snack, permen, wafer, minuman)");
  console.log("   Products:   9 (with multi-unit support)");
  console.log("   Settings:   1 (store configuration)");
  console.log("\n🔑 All passwords: password");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
