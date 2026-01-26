/**
 * @deprecated This file is deprecated. Import from '@/services/processors/tax' instead.
 * This file is maintained for backward compatibility only.
 */

// Re-export everything from the new modular structure
export * from './tax'

// Legacy named exports for backward compatibility
export { INK2SRUProcessor } from './tax'
export type { AccountBalance, CompanyInfo, INK2CalculationResult } from './tax'
export { calculateAccountBalances } from './tax'
