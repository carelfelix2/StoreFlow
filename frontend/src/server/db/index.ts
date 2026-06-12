// =============================================================================
// Felix Snack POS — DB Layer Index
// Re-exports Prisma client singleton + repository/service barrel.
// =============================================================================

export { prisma, default as db } from "@/lib/prisma";

// Repositories
export * from "./repositories/category-repository";

// Services
export * from "./services/category-service";
export * from "./services/product-service";
