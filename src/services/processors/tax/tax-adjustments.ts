/**
 * INK2S Tax Adjustment Field Calculator
 * Calculates tax adjustments for Swedish corporate tax declarations
 */

import type { SRUField } from "@/types/sru"
import type { AccountBalance } from './types'
import { sumAccountRange } from './types'

/**
 * Calculate INK2S Tax Adjustment fields
 */
export function calculateTaxAdjustments(
  incomeStatementFields: SRUField[],
  balances: Map<string, AccountBalance>
): SRUField[] {
  const fields: SRUField[] = []

  // Get the accounting result
  const profitField = incomeStatementFields.find(f => f.code === 7450)
  const lossField = incomeStatementFields.find(f => f.code === 7550)

  if (profitField) {
    fields.push({ code: 7650, value: profitField.value })
  }
  if (lossField) {
    fields.push({ code: 7750, value: lossField.value })
  }

  // Add back non-deductible items (4.3)

  // Tax expense (not deductible)
  const taxExpense = Math.abs(sumAccountRange(balances, 8900, 8999))
  if (taxExpense > 0) {
    fields.push({ code: 7651, value: taxExpense })
  }

  // Representation (partially non-deductible)
  // Default assumption: 50% non-deductible per IL 20:23.
  // This is a simplification — actual deductibility depends on business purpose.
  // Flag large amounts for manual review.
  const REPRESENTATION_NON_DEDUCTIBLE_RATIO = 0.5
  const representationCost = Math.abs(sumAccountRange(balances, 6070, 6079))
  if (representationCost > 0) {
    const nonDeductible = Math.round(representationCost * REPRESENTATION_NON_DEDUCTIBLE_RATIO)
    if (nonDeductible > 0) {
      fields.push({ code: 7653, value: nonDeductible })
    }
  }

  // Tax-exempt dividends (näringsbetingade andelar) — accounts 8012-8019
  const taxExemptDividends = Math.abs(sumAccountRange(balances, 8012, 8019))
  if (taxExemptDividends > 0) {
    fields.push({ code: 7753, value: taxExemptDividends })
  }

  // Calculate taxable result
  const bookProfit = typeof profitField?.value === 'number' ? profitField.value : 0
  const bookLoss = typeof lossField?.value === 'number' ? lossField.value : 0
  const addBacks = taxExpense + Math.round((representationCost || 0) * REPRESENTATION_NON_DEDUCTIBLE_RATIO)

  const taxableResult = (bookProfit - bookLoss) + addBacks - taxExemptDividends

  if (taxableResult >= 0) {
    fields.push({ code: 8020, value: taxableResult }) // Överskott (till p. 1.1)
  } else {
    fields.push({ code: 8021, value: Math.abs(taxableResult) }) // Underskott (till p. 1.2)
  }

  return fields
}
