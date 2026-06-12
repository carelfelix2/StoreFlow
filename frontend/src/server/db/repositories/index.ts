// =============================================================================
// Felix Snack POS — DB Repositories Barrel
// Pattern: one repository per domain aggregate.
// All queries flow through repositories to ensure:
//   - Consistent error handling
//   - Single source of truth for query patterns
//   - Easy testing via dependency injection
// =============================================================================

export * from "./category-repository";
