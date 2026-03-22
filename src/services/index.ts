// ============================================
// Services Layer - Central Export
// ============================================

// Domain services
export * from "./accounting"
export * from "./tax"
export * from "./payroll"
export * from "./corporate"
export * from "./invoicing"
export * from "./reporting"
export * from "./common"
export * from "./company"

// Processor services - import directly from @/services/processors/*
// Not re-exported here to avoid naming conflicts (e.g. FinancialSection)
// export * from "./processors/invoice-processor"
// export * from "./processors/reports"
