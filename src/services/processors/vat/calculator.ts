/**
 * VAT Report Calculator
 * Calculates VAT reports from various data sources using canonical vat-boxes mapping.
 */

import type { Verification } from "@/types/verification"
import type { VatReport } from './types'
import {
  createEmptyVatReport,
  recalculateVatReport,
  getVatDeadline,
  formatDate,
  parsePeriod,
  isDateInQuarter,
} from './utils'
import { VAT_BOXES, findBoxesForAccount, type VatBoxDefinition } from './vat-boxes'

/**
 * Apply a ledger row to a VatReport using the canonical vat-boxes mapping.
 * Handles credit_net and debit_net sides, then computes reverse charge output VAT.
 */
function applyRowToReport(
  report: VatReport,
  account: string,
  debit: number,
  credit: number,
): void {
  const creditNet = credit - debit
  const debitNet = debit - credit

  const matchingBoxes = findBoxesForAccount(account)
  for (const box of matchingBoxes) {
    const value = box.side === 'credit_net' ? creditNet : debitNet
    const key = box.field as keyof VatReport
    ;(report[key] as number) += value * box.sign
  }
}

/**
 * Compute Section D (reverse charge output VAT) from Section C bases.
 *
 * For reverse charge purchases, the buyer must self-assess output VAT.
 * We compute ruta30/31/32 based on which accounts contributed to ruta20-24.
 *
 * BAS convention:
 * - 4515 = EU goods 25%, 4516 = EU goods 12%, 4517 = EU goods 6%
 * - 4535 = EU services 25%, 4536 = EU services 12%
 * - 4545 = domestic RC 25%, 4546 = domestic RC 12%, 4547 = domestic RC 6%
 * - 4531 = non-EU services (25% default)
 * - 4549 = other RC services (25% default)
 */
function computeReverseChargeVAT(
  report: VatReport,
  accountTotals: Map<string, number>,
): void {
  // Accounts that carry 12% VAT rate
  const rate12Accounts = new Set(['4516', '4536', '4546'])
  // Accounts that carry 6% VAT rate
  const rate6Accounts = new Set(['4517', '4547'])
  // Everything else in Section C is 25%

  let base25 = 0
  let base12 = 0
  let base6 = 0

  for (const [account, total] of accountTotals) {
    // Only process accounts that map to Section C boxes
    const boxes = findBoxesForAccount(account)
    const isSectionC = boxes.some(b => b.section === 'C')
    if (!isSectionC || total <= 0) continue

    if (rate12Accounts.has(account)) {
      base12 += total
    } else if (rate6Accounts.has(account)) {
      base6 += total
    } else {
      base25 += total
    }
  }

  report.ruta30 = Math.round(base25 * 0.25)
  report.ruta31 = Math.round(base12 * 0.12)
  report.ruta32 = Math.round(base6 * 0.06)
}

/**
 * Fallback: if sales base boxes (05, 06, 07) are empty but we have
 * output VAT amounts, reverse-calculate the bases from VAT.
 * This handles the common case where bookkeeping uses a single 3xxx
 * sales account for all VAT rates.
 */
function reverseCalculateSalesBases(report: VatReport): void {
  // If ruta06/07 have direct account values, trust them.
  // Otherwise, reverse-calculate from VAT amounts.
  if (report.ruta06 === 0 && report.ruta11 > 0) {
    report.ruta06 = Math.round(report.ruta11 / 0.12)
  }
  if (report.ruta07 === 0 && report.ruta12 > 0) {
    report.ruta07 = Math.round(report.ruta12 / 0.06)
  }

  // If ruta05 was populated from a broad 3xxx range that also includes
  // 12% and 6% sales, subtract those bases to avoid double-counting.
  if (report.ruta05 > 0 && (report.ruta06 > 0 || report.ruta07 > 0)) {
    report.ruta05 = Math.max(0, report.ruta05 - report.ruta06 - report.ruta07)
  }
}

export const VatCalculator = {
  /**
   * Calculate VAT report from verifikationer for a given period.
   * Uses canonical vat-boxes mapping for all 33 rutor.
   */
  calculateFromVerifications(verifikationer: Verification[], period: string): VatReport {
    const { quarter, year } = parsePeriod(period)
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2

    const periodTransactions = verifikationer.filter(v => {
      const d = new Date(v.date)
      return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
    })

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    const report = createEmptyVatReport(period, formatDate(dueDate), status)

    // Track per-account totals for reverse charge VAT computation
    const accountTotals = new Map<string, number>()

    periodTransactions.forEach(v => {
      if (!v.rows) return
      v.rows.forEach(row => {
        const debit = row.debit || 0
        const credit = row.credit || 0
        applyRowToReport(report, row.account, debit, credit)

        // Accumulate debit_net per account for Section C → D computation
        const debitNet = debit - credit
        if (debitNet > 0) {
          accountTotals.set(row.account, (accountTotals.get(row.account) || 0) + debitNet)
        }
      })
    })

    computeReverseChargeVAT(report, accountTotals)
    reverseCalculateSalesBases(report)

    return recalculateVatReport(report)
  },

  /**
   * Calculate VAT report from transactions for a given period.
   * Transactions have explicit vatAmount/vatRate (no account mapping needed).
   */
  calculateFromTransactions(
    transactions: { amountValue: number; vatAmount?: number; vatRate?: number; timestamp: Date }[],
    period: string
  ): VatReport {
    const { quarter, year } = parsePeriod(period)
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2

    const periodTransactions = transactions.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
    })

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    const report = createEmptyVatReport(period, formatDate(dueDate), status)

    periodTransactions.forEach(t => {
      if (t.vatAmount) {
        if (t.vatAmount > 0) {
          if (t.vatRate === 25) report.ruta10 += t.vatAmount
          else if (t.vatRate === 12) report.ruta11 += t.vatAmount
          else if (t.vatRate === 6) report.ruta12 += t.vatAmount
        } else {
          report.ruta48 += Math.abs(t.vatAmount)
        }
      }
    })

    if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
    if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
    if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

    return recalculateVatReport(report)
  },

  /**
   * Calculate VAT report from source documents.
   * Documents have explicit vatAmount/vatRate (no account mapping needed).
   */
  calculateFromDocuments(params: {
    customerInvoices: Array<{ issueDate: string; vatAmount?: number; vatRate?: number }>
    supplierInvoices: Array<{ invoiceDate: string; vatAmount: number }>
    receipts?: Array<{ date: string; vatAmount?: number }>
    period: string
  }): VatReport {
    const { customerInvoices, supplierInvoices, receipts = [], period } = params
    const { quarter, year } = parsePeriod(period)
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2

    const isInPeriod = (dateStr: string) => {
      const d = new Date(dateStr)
      return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
    }

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    const report = createEmptyVatReport(period, formatDate(dueDate), status)

    customerInvoices
      .filter(inv => isInPeriod(inv.issueDate))
      .forEach(inv => {
        if (inv.vatAmount) {
          if (inv.vatRate === 25) report.ruta10 += inv.vatAmount
          else if (inv.vatRate === 12) report.ruta11 += inv.vatAmount
          else if (inv.vatRate === 6) report.ruta12 += inv.vatAmount
        }
      })

    supplierInvoices
      .filter(inv => isInPeriod(inv.invoiceDate))
      .forEach(inv => {
        report.ruta48 += inv.vatAmount
      })

    receipts
      .filter(r => isInPeriod(r.date))
      .forEach(r => {
        if (r.vatAmount) report.ruta48 += r.vatAmount
      })

    if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
    if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
    if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

    return recalculateVatReport(report)
  },

  /**
   * Calculate VAT report from Real Verifications (Ledger).
   * This is the primary calculation method used by the UI.
   * Uses canonical vat-boxes mapping for all 33 rutor.
   */
  calculateFromRealVerifications(verifications: Verification[], period: string): VatReport {
    const { quarter, year } = parsePeriod(period)

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    const report = createEmptyVatReport(period, formatDate(dueDate), status)
    const accountTotals = new Map<string, number>()

    verifications.forEach(v => {
      const d = new Date(v.date)
      if (!isDateInQuarter(d, quarter, year)) return

      v.rows.forEach(row => {
        const debit = row.debit || 0
        const credit = row.credit || 0
        applyRowToReport(report, row.account, debit, credit)

        const debitNet = debit - credit
        if (debitNet > 0) {
          accountTotals.set(row.account, (accountTotals.get(row.account) || 0) + debitNet)
        }
      })
    })

    computeReverseChargeVAT(report, accountTotals)
    reverseCalculateSalesBases(report)

    return recalculateVatReport(report)
  },
}
