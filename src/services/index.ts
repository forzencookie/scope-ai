// ============================================
// Services Layer - Central Export
// ============================================

// Transaction services - use transactions.ts for mock/dev, transactions-supabase.ts for production
// Default export is the mock service for development
export * from "./transactions"

// Processor services - transform raw data into display-ready format
export * from "./processors/invoice-processor"
export * from "./processors/reports-processor"

// Simulator services - for testing/demo
export * from "./myndigheter-client"

// Domain services (consolidated from lib/services)
export * from "./asset-service"
export * from "./benefit-service"
export * from "./inventarie-service"
export * from "./invoice-service"
export * from "./payroll-service"
export * from "./receipt-service"
export * from "./tax-declaration-service"
export * from "./tax-service"
export { transactionService } from "./transaction-service"
export * from "./vat-service"
