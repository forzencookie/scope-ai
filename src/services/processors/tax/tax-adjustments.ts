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
  const representationCost = Math.abs(sumAccountRange(balances, 6070, 6079))
  if (representationCost > 0) {
    // Assume 50% non-deductible for simplicity
    const nonDeductible = Math.round(representationCost * 0.5)
    if (nonDeductible > 0) {
      fields.push({ code: 7653, value: nonDeductible })
    }
  }

  // Calculate taxable result
  const bookProfit = typeof profitField?.value === 'number' ? profitField.value : 0
  const bookLoss = typeof lossField?.value === 'number' ? lossField.value : 0
  const addBacks = taxExpense + Math.round((representationCost || 0) * 0.5)

  const taxableResult = (bookProfit - bookLoss) + addBacks

  if (taxableResult >= 0) {
    fields.push({ code: 7670, value: taxableResult }) // Överskott
  } else {
    fields.push({ code: 7770, value: Math.abs(taxableResult) }) // Underskott
  }

  return fields
}
