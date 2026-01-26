/**
 * @deprecated This file is deprecated. Import from '@/services/processors/vat' instead.
 * This file is maintained for backward compatibility only.
 */

// Re-export everything from the new modular structure
export * from './vat'

// Legacy named exports for backward compatibility
export { VatProcessor } from './vat'
export type { VatReport } from './vat'

// Also re-export utility functions that were previously in this file
export { recalculateVatReport, createEmptyVatReport } from './vat'
