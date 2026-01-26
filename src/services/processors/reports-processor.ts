/**
 * @deprecated This file is deprecated. Import from '@/services/processors/reports' instead.
 * This file is maintained for backward compatibility only.
 */

// Re-export everything from the new modular structure
export * from './reports'

// Legacy named exports for backward compatibility
export { FinancialReportProcessor } from './reports'
export type { AccountBalance, FinancialSection, FinancialSectionItem } from './reports'
