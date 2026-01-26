/**
 * Sales entry creator
 * For recording customer invoices and sales transactions
 */

import type { JournalEntry, JournalEntryLine, SwedishVatRate } from '../types'
import { roundToOre } from '../validation'
import { calculateVat, getVatAccount } from '../vat'
import { generateEntryId } from '../utils'

export interface SalesEntryParams {
  /** Invoice date (YYYY-MM-DD) */
  date: string
  /** Customer name or description */
  description: string
  /** Total amount (gross, including VAT) */
  grossAmount: number
  /** Revenue account to credit */
  revenueAccount?: string
  /** VAT rate for this sale */
  vatRate?: SwedishVatRate
  /** Customer receivable account (default: 1510 Kundfordringar) */
  receivableAccount?: string
  /** If paid immediately (cash/card), use bank instead */
  paidImmediately?: boolean
  /** Bank account for immediate payment */
  bankAccount?: string
  /** Optional invoice number */
  invoiceNumber?: string
  /** Series identifier */
  series?: string
}

/**
 * Create a sales/income journal entry
 * 
 * Standard flow:
 * 1. Debit customer receivable (or bank) with gross amount
 * 2. Credit revenue account (net amount)
 * 3. Credit output VAT account (VAT amount)
 * 
 * @example
 * // Customer invoice with VAT
 * createSalesEntry({
 *   date: '2024-01-15',
 *   description: 'Consulting services January',
 *   grossAmount: 50000,
 *   revenueAccount: '3010', // Försäljning tjänster
 *   vatRate: 25,
 * })
 * 
 * @example
 * // Cash sale
 * createSalesEntry({
 *   date: '2024-01-15',
 *   description: 'Product sale',
 *   grossAmount: 1250,
 *   revenueAccount: '3001', // Försäljning varor
 *   vatRate: 25,
 *   paidImmediately: true,
 * })
 */
export function createSalesEntry(params: SalesEntryParams): JournalEntry {
  const {
    date,
    description,
    grossAmount,
    revenueAccount = '3010', // Försäljning tjänster
    vatRate = 25,
    receivableAccount = '1510', // Kundfordringar
    paidImmediately = false,
    bankAccount = '1930',
    invoiceNumber,
    series = 'A', // A-series for customer invoices
  } = params

  const rows: JournalEntryLine[] = []
  const gross = roundToOre(grossAmount)

  // Debit the appropriate account (receivable or bank)
  const debitAccount = paidImmediately ? bankAccount : receivableAccount
  const debitDescription = paidImmediately 
    ? 'Inbetalning' 
    : invoiceNumber 
      ? `Kundfaktura ${invoiceNumber}` 
      : 'Kundfordran'

  rows.push({
    account: debitAccount,
    debit: gross,
    credit: 0,
    description: debitDescription,
  })

  if (vatRate > 0) {
    const vatMultiplier = vatRate / 100
    const netAmount = roundToOre(gross / (1 + vatMultiplier))
    const vatAmount = roundToOre(gross - netAmount)
    const vatAccount = getVatAccount(vatRate, 'output')

    // Credit revenue (net)
    rows.push({
      account: revenueAccount,
      debit: 0,
      credit: netAmount,
      description: `${description} (exkl moms)`,
    })

    // Credit output VAT
    rows.push({
      account: vatAccount,
      debit: 0,
      credit: vatAmount,
      description: `Utgående moms ${vatRate}%`,
    })
  } else {
    // No VAT - credit full amount to revenue
    rows.push({
      account: revenueAccount,
      debit: 0,
      credit: gross,
      description,
    })
  }

  return {
    id: generateEntryId(),
    date,
    description: invoiceNumber ? `${description} (Faktura ${invoiceNumber})` : description,
    series,
    rows,
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a customer payment entry (receiving payment on receivable)
 * 
 * Flow:
 * 1. Debit bank (money coming in)
 * 2. Credit customer receivable (reduce claim)
 */
export function createPaymentReceivedEntry(params: {
  date: string
  description: string
  amount: number
  receivableAccount?: string
  bankAccount?: string
  invoiceReference?: string
  series?: string
}): JournalEntry {
  const {
    date,
    description,
    amount,
    receivableAccount = '1510',
    bankAccount = '1930',
    invoiceReference,
    series = 'A',
  } = params

  const roundedAmount = roundToOre(amount)

  return {
    id: generateEntryId(),
    date,
    description: invoiceReference ? `${description} (${invoiceReference})` : description,
    series,
    rows: [
      {
        account: bankAccount,
        debit: roundedAmount,
        credit: 0,
        description: 'Inbetalning kundfordran',
      },
      {
        account: receivableAccount,
        debit: 0,
        credit: roundedAmount,
        description: invoiceReference ? `Faktura ${invoiceReference}` : 'Kundfordran',
      },
    ],
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Create a credit note entry (reversing a sale)
 */
export function createCreditNoteEntry(params: {
  date: string
  description: string
  grossAmount: number
  revenueAccount?: string
  vatRate?: SwedishVatRate
  receivableAccount?: string
  creditNoteNumber?: string
  series?: string
}): JournalEntry {
  const {
    date,
    description,
    grossAmount,
    revenueAccount = '3010',
    vatRate = 25,
    receivableAccount = '1510',
    creditNoteNumber,
    series = 'A',
  } = params

  const rows: JournalEntryLine[] = []
  const gross = roundToOre(grossAmount)

  // Opposite of sales entry: debit revenue, debit VAT, credit receivable
  if (vatRate > 0) {
    const vatMultiplier = vatRate / 100
    const netAmount = roundToOre(gross / (1 + vatMultiplier))
    const vatAmount = roundToOre(gross - netAmount)
    const vatAccount = getVatAccount(vatRate, 'output')

    rows.push(
      { account: revenueAccount, debit: netAmount, credit: 0, description: 'Kreditering' },
      { account: vatAccount, debit: vatAmount, credit: 0, description: `Moms kreditering ${vatRate}%` },
      { account: receivableAccount, debit: 0, credit: gross, description: 'Kreditfaktura' },
    )
  } else {
    rows.push(
      { account: revenueAccount, debit: gross, credit: 0, description: 'Kreditering' },
      { account: receivableAccount, debit: 0, credit: gross, description: 'Kreditfaktura' },
    )
  }

  return {
    id: generateEntryId(),
    date,
    description: creditNoteNumber 
      ? `Kreditfaktura ${creditNoteNumber}: ${description}` 
      : `Kreditering: ${description}`,
    series,
    rows,
    finalized: false,
    createdAt: new Date().toISOString(),
  }
}
