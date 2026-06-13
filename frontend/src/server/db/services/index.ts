// =============================================================================
// Felix Snack POS — DB Services Barrel
// Pattern: one service per business capability.
// Services orchestrate multiple repositories + external APIs.
// Route Handlers call services, not repositories directly.
// =============================================================================

export * from "./category-service";
export * from "./product-service";
export * from "./user-service";

// To be added in future phases:
// export * from "./order-service";
// export * from "./payment-service";
// export * from "./stock-service";
