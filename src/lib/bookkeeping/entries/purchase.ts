/**
 * Purchase entry creator
 * For recording supplier invoices and purchase transactions
 */

import type { JournalEntry, JournalEntryLine, SwedishVatRate } from '../types'
import { roundToOre } from '../validation'
import { calculateVat, getVatAccount } from '../vat'
import { generateEntryId } from '../utils'

export interface PurchaseEntryParams {
  /** Invoice/transaction date (YYYY-MM-DD) */
  date: string
  /** Supplier name or description */
  description: string
  /** Total amount (gross, including VAT) */
  grossAmount: number
  /** Expense account to debit */
  expenseAccount: string
  /** VAT rate for this purchase */
  vatRate?: SwedishVatRate
  /** Payment method account (default: 2440 Leverantörsskulder) */
  liabilityAccount?: string
  /** If paid immediately, use bank account instead */
  paidImmediately?: boolean
  /** Bank account for immediate payment */
  bankAccount?: string
  /** Optional invoice reference */
  invoiceReference?: string
  /** Series identifier */
  series?: string
}

/**
 * Create a purchase/expense journal entry
 * 
 * Standard flow:
 * 1. Debit expense account (net amount)
 * 2. Debit input VAT account (VAT amount)
 * 3. Credit supplier liability (gross amount)
 * 
 * @example
 * // Supplier invoice with VAT
 * createPurchaseEntry({
 *   date: '2024-01-15',
 *   description: 'Office rent January',
 *   grossAmount: 12500,
 *   expenseAccount: '5010', // Lokalhyra
 *   vatRate: 25,
 * })
 * 
 * @example
 * // Immediate payment (e.g., card purchase)
 * createPurchaseEntry({
 *   date: '2024-01-15',
 *   description: 'Software subscription',
 *   grossAmount: 999,
 *   expenseAccount: '6540', // IT-kostnader
 *   vatRate: 25,
 *   paidImmediately: true,
 *   bankAccount: '1930',
 * })
 */
export function createPurchaseEntry(params: PurchaseEntryParams): JournalEntry {
  const {
    date,
    description,
    grossAmount,
    expenseAccount,
    vatRate = 25,
    liabilityAccount = '2440', // Leverantörsskulder
    paidImmediately = false,
    bankAccount = '1930',
    invoiceReference,
    series = 'B', // B-series for supplier invoices
  } = params

  const rows: JournalEntryLine[] = []
  const gross = roundToOre(grossAmount)

  if (vatRate > 0) {
    const vatMultiplier = vatRate / 100
    const netAmount = roundToOre(gross / (1 + vatMultiplier))
    const vatAmount = roundToOre(gross - netAmount)
    const vatAccount = getVatAccount(vatRate, 'input')

    // Debit expense (net)
    rows.push({
      account: expenseAccount,
      debit: netAmount,
      credit: 0,
      description: `${description} (exkl moms)`,
    })

    // Debit input VAT
    rows.push({
      account: vatAccount,
      debit: vatAmount,
      credit: 0,
      description: `Ingående moms ${vatRate}%`,
    })
  } else {
    // No VAT - debit full amount to expense
    rows.push({
      account: expenseAccount,
      debit: gross,
      credit: 0,
      description,
    })
  }

  // Credit the appropriate account
  const creditAccount = paidImmediately ? bankAccount : liabilityAccount
  const creditDescription = paidImmediately 
    ? 'Betalning' 
    : invoiceReference 
      ? `Lev.skuld ref: ${invoiceReference}` 
      : 'Leverantörsskuld'

  rows.push({
    account: creditAccount,
    debit: 0,
    credit: gross,
    description: creditDescription,
  })

  return {
    id: generateEntryId(),
    date,
    description: invoiceReference ? `${description} (${invoiceReference})` : description,
    series,
    rows,
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a supplier payment entry (paying off supplier liability)
 * 
 * Flow:
 * 1. Debit supplier liability (reduce debt)
 * 2. Credit bank (money leaving)
 */
export function createSupplierPayment(params: {
  date: string
  description: string
  amount: number
  liabilityAccount?: string
  bankAccount?: string
  series?: string
}): JournalEntry {
  const {
    date,
    description,
    amount,
    liabilityAccount = '2440',
    bankAccount = '1930',
    series = 'B',
  } = params

  const roundedAmount = roundToOre(amount)

  return {
    id: generateEntryId(),
    date,
    description,
    series,
    rows: [
      {
        account: liabilityAccount,
        debit: roundedAmount,
        credit: 0,
        description: 'Betalning leverantörsskuld',
      },
      {
        account: bankAccount,
        debit: 0,
        credit: roundedAmount,
        description: 'Utbetalning',
      },
    ],
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}
