// =============================================================================
// Felix Snack POS — DB Repositories Barrel
// Pattern: one repository per domain aggregate.
// All queries flow through repositories to ensure:
//   - Consistent error handling
//   - Single source of truth for query patterns
//   - Easy testing via dependency injection
//
// NOTE: Services import repositories directly (not through this barrel).
// Barrel re-exports would conflict due to shared function names (create,
// findById, findMany, update) across domain aggregates.
// =============================================================================

export * from "./category-repository";
