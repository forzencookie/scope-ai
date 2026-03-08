// ============================================
// Services Layer - Central Export
// ============================================

// Core accounting services (Pattern A: direct Supabase)
export * from "./transactions"
export * from "./verification-service"
export * from "./invoice-service"
export * from "./receipt-service"
export * from "./account-service"

// Asset & inventory
export * from "./inventarie-service"

// Tax & compliance
export * from "./tax-service"
export * from "./tax-declaration-service"
export * from "./vat-service"

// Payroll & benefits
export * from "./payroll-service"
export * from "./benefit-service"

// Company & governance
export * from "./company-service"
export * from "./company-statistics-service"
export * from "./shareholder-service"
export * from "./board-service"

// Period management
export * from "./closing-entry-service"
export * from "./accrual-service"
export * from "./correction-service"

// Events & planning
export * from "./event-service"
export * from "./roadmap-service"

// Settings & uploads
export * from "./settings-service"
export * from "./upload-service"

// Navigation (uses API proxy pattern for auth)
export * from "./navigation"

// AI memory (Scooby's per-company memory)
export * from "./user-memory-service"

// Processor services - transform raw data into display-ready format
export * from "./processors/invoice-processor"
export * from "./processors/reports"

