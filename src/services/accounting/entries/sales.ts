/**
 * Sales entry creator
 * For recording customer invoices and sales transactions
 */

import type { JournalEntry, JournalEntryLine, SwedishVatRate } from '../types'
import { DEFAULT_ACCOUNTS, PAYMENT_ACCOUNTS } from '../types'
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
  /** Accounting method: 'cash' skips receivables (1510), booking directly to bank */
  accountingMethod?: 'cash' | 'invoice'
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
    revenueAccount = DEFAULT_ACCOUNTS.SALES_REVENUE,
    vatRate = 25,
    receivableAccount = DEFAULT_ACCOUNTS.CUSTOMER_RECEIVABLES,
    paidImmediately = false,
    bankAccount = PAYMENT_ACCOUNTS.BANK,
    invoiceNumber,
    series = 'A', // A-series for customer invoices
    accountingMethod = 'invoice',
  } = params

  const rows: JournalEntryLine[] = []
  const gross = roundToOre(grossAmount)

  // Cash method: always debit bank directly (no receivable)
  const useBankDirect = accountingMethod === 'cash' || paidImmediately
  const debitAccount = useBankDirect ? bankAccount : receivableAccount
  const debitDescription = useBankDirect
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
 * Invoice line item with per-line VAT rate
 */
export interface InvoiceLineItem {
  description?: string
  quantity: number
  unitPrice: number
  vatRate?: number
}

export interface MultiVatSalesEntryParams {
  /** Invoice date (YYYY-MM-DD) */
  date: string
  /** Description (e.g., customer name + invoice number) */
  description: string
  /** Total gross amount (including all VAT) */
  grossAmount: number
  /** Line items with per-line VAT rates */
  lineItems: InvoiceLineItem[]
  /** Revenue account (default: 3001) */
  revenueAccount?: string
  /** Receivable account (default: 1510) */
  receivableAccount?: string
  /** Bank account for cash method */
  bankAccount?: string
  /** Invoice number for description */
  invoiceNumber?: string
  /** Series identifier */
  series?: string
  /** Accounting method: 'cash' skips receivables (1510), booking directly to bank */
  accountingMethod?: 'cash' | 'invoice'
}

/**
 * Create a sales journal entry for invoices with multiple VAT rates.
 * Groups line items by VAT rate and creates revenue + output VAT entries per group.
 */
export function createMultiVatSalesEntry(params: MultiVatSalesEntryParams): JournalEntry {
  const {
    date,
    description,
    grossAmount,
    lineItems,
    revenueAccount = DEFAULT_ACCOUNTS.SALES_REVENUE,
    receivableAccount = DEFAULT_ACCOUNTS.CUSTOMER_RECEIVABLES,
    bankAccount = PAYMENT_ACCOUNTS.BANK,
    invoiceNumber,
    series = 'A',
    accountingMethod = 'invoice',
  } = params

  const rows: JournalEntryLine[] = []
  const gross = roundToOre(grossAmount)

  // Cash method: debit bank directly (no receivable)
  const debitAccount = accountingMethod === 'cash' ? bankAccount : receivableAccount
  const debitDescription = accountingMethod === 'cash'
    ? 'Inbetalning'
    : invoiceNumber ? `Kundfaktura ${invoiceNumber}` : 'Kundfordran'

  rows.push({
    account: debitAccount,
    debit: gross,
    credit: 0,
    description: debitDescription,
  })

  // Group line items by VAT rate
  const vatGroups = new Map<SwedishVatRate, number>()
  for (const item of lineItems) {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    const lineNet = roundToOre(qty * price)
    const rawRate = Number(item.vatRate) ?? 25
    const vatRate: SwedishVatRate = isValidVatRate(rawRate) ? rawRate : 25
    vatGroups.set(vatRate, (vatGroups.get(vatRate) || 0) + lineNet)
  }

  // Credit revenue and output VAT per group
  for (const [vatRate, netAmount] of vatGroups) {
    const roundedNet = roundToOre(netAmount)

    rows.push({
      account: revenueAccount,
      debit: 0,
      credit: roundedNet,
      description: vatRate > 0 ? `Försäljning (exkl moms ${vatRate}%)` : 'Försäljning (momsfri)',
    })

    if (vatRate > 0) {
      const vatAmount = roundToOre(roundedNet * (vatRate / 100))
      const vatAccount = getVatAccount(vatRate, 'output')

      rows.push({
        account: vatAccount,
        debit: 0,
        credit: vatAmount,
        description: `Utgående moms ${vatRate}%`,
      })
    }
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

function isValidVatRate(rate: number): rate is SwedishVatRate {
  return rate === 0 || rate === 6 || rate === 12 || rate === 25
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
    receivableAccount = DEFAULT_ACCOUNTS.CUSTOMER_RECEIVABLES,
    bankAccount = PAYMENT_ACCOUNTS.BANK,
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
    revenueAccount = DEFAULT_ACCOUNTS.SALES_REVENUE,
    vatRate = 25,
    receivableAccount = DEFAULT_ACCOUNTS.CUSTOMER_RECEIVABLES,
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
