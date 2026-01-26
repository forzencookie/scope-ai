/**
 * VAT Processor Module
 * 
 * Complete VAT processing for Swedish Momsdeklaration (SKV 4700)
 * 
 * @module vat
 * 
 * @example
 * import { VatCalculator, VatProcessor, type VatReport } from '@/services/processors/vat'
 * 
 * // Calculate VAT report from verifications
 * const report = VatCalculator.calculateFromVerifications(verifications, 'Q4 2024')
 * 
 * // Generate XML for Skatteverket
 * const xml = VatProcessor.generateXML(report, '556000-0000')
 */

// Types
export type { VatReport, VatPeriodSummary } from './types'

// Utilities
export {
  getVatDeadline,
  formatDate,
  createEmptyVatReport,
  recalculateVatReport,
  parsePeriod,
  isDateInQuarter,
} from './utils'

// Calculator
export { VatCalculator } from './calculator'

// XML Export
export { generateVatXML, generateFullVatXML } from './xml-export'

// Legacy compatibility - VatProcessor object matching old API
import { VatCalculator } from './calculator'
import { generateVatXML } from './xml-export'

/**
 * @deprecated Use VatCalculator directly
 * Maintained for backward compatibility
 */
export const VatProcessor = {
  calculateReport: VatCalculator.calculateFromVerifications,
  calculateReportFromTransactions: VatCalculator.calculateFromTransactions,
  calculateReportFromDocuments: VatCalculator.calculateFromDocuments,
  calculateReportFromRealVerifications: VatCalculator.calculateFromRealVerifications,
  generateXML: generateVatXML,
}
