/**
 * Simple journal entry creator
 * For basic two-line transactions (debit one account, credit another)
 */

import type { JournalEntry, JournalEntryLine, SwedishVatRate } from '../types'
import { roundToOre } from '../validation'
import { calculateVat, getVatAccount } from '../vat'
import { generateEntryId } from '../utils'

export interface SimpleEntryParams {
  /** Transaction date (YYYY-MM-DD) */
  date: string
  /** Description of the transaction */
  description: string
  /** Total amount (gross, including VAT if applicable) */
  amount: number
  /** Account to debit */
  debitAccount: string
  /** Account to credit */
  creditAccount: string
  /** Optional VAT rate */
  vatRate?: SwedishVatRate
  /** Whether this is an income (affects VAT account direction) */
  isIncome?: boolean
  /** Optional series for the entry */
  series?: string
}

/**
 * Create a simple two-line journal entry (or three with VAT)
 * 
 * @example
 * // Simple bank transfer
 * createSimpleEntry({
 *   date: '2024-01-15',
 *   description: 'Transfer to tax account',
 *   amount: 50000,
 *   debitAccount: '1630',  // Skattekonto
 *   creditAccount: '1930', // Bank
 * })
 * 
 * @example
 * // Expense with VAT
 * createSimpleEntry({
 *   date: '2024-01-15',
 *   description: 'Office supplies',
 *   amount: 1250, // Gross amount
 *   debitAccount: '6110',  // Kontorsmaterial
 *   creditAccount: '1930', // Bank
 *   vatRate: 25,
 * })
 */
export function createSimpleEntry(params: SimpleEntryParams): JournalEntry {
  const {
    date,
    description,
    amount,
    debitAccount,
    creditAccount,
    vatRate = 0,
    isIncome = false,
    series,
  } = params

  const rows: JournalEntryLine[] = []

  if (vatRate > 0) {
    // Calculate VAT split
    const grossAmount = roundToOre(amount)
    const vatAmount = calculateVat(grossAmount / (1 + vatRate / 100), vatRate)
    const netAmount = roundToOre(grossAmount - vatAmount)
    const vatAccount = getVatAccount(vatRate, isIncome ? 'output' : 'input')

    if (isIncome) {
      // Income: Credit revenue, credit VAT, debit bank
      rows.push(
        { account: debitAccount, debit: grossAmount, credit: 0, description: 'Inbetalning' },
        { account: creditAccount, debit: 0, credit: netAmount, description: 'Intäkt exkl moms' },
        { account: vatAccount, debit: 0, credit: vatAmount, description: `Utgående moms ${vatRate}%` },
      )
    } else {
      // Expense: Debit expense, debit input VAT, credit bank
      rows.push(
        { account: debitAccount, debit: netAmount, credit: 0, description: 'Kostnad exkl moms' },
        { account: vatAccount, debit: vatAmount, credit: 0, description: `Ingående moms ${vatRate}%` },
        { account: creditAccount, debit: 0, credit: grossAmount, description: 'Utbetalning' },
      )
    }
  } else {
    // No VAT - simple two-line entry
    rows.push(
      { account: debitAccount, debit: roundToOre(amount), credit: 0 },
      { account: creditAccount, debit: 0, credit: roundToOre(amount) },
    )
  }

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows,
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}
