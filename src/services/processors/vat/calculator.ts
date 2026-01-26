/**
 * VAT Report Calculator
 * Calculates VAT reports from various data sources
 */

import type { Verification } from "@/hooks/use-verifications"
import type { VatReport } from './types'
import {
  createEmptyVatReport,
  recalculateVatReport,
  getVatDeadline,
  formatDate,
  parsePeriod,
  isDateInQuarter,
} from './utils'

export const VatCalculator = {
  /**
   * Calculate VAT report from verifikationer for a given period.
   * Maps BAS account codes to the appropriate rutor.
   */
  calculateFromVerifications(verifikationer: Verification[], period: string): VatReport {
    const { quarter, year } = parsePeriod(period)
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2

    // Filter Transactions
    const periodTransactions = verifikationer.filter(v => {
      const d = new Date(v.date)
      return d.getFullYear() === year && d.getMonth() >= startMonth && d.getMonth() <= endMonth
    })

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    // Start with empty report
    const report = createEmptyVatReport(period, formatDate(dueDate), status)

    // Map accounts to rutor
    // BAS account mappings for Swedish VAT:
    // 2610-2619: Utgående moms 25%
    // 2620-2629: Utgående moms 12%
    // 2630-2639: Utgående moms 6%
    // 2640-2649: Ingående moms
    periodTransactions.forEach(v => {
      if (!v.rows) return

      v.rows.forEach(row => {
        const konto = row.account

        // Output VAT 25% (2610-2619)
        if (konto >= "2610" && konto <= "2619") {
          if (row.credit) report.ruta10 += row.credit
        }
        // Output VAT 12% (2620-2629)
        else if (konto >= "2620" && konto <= "2629") {
          if (row.credit) report.ruta11 += row.credit
        }
        // Output VAT 6% (2630-2639)
        else if (konto >= "2630" && konto <= "2639") {
          if (row.credit) report.ruta12 += row.credit
        }
        // Input VAT (2640-2649)
        else if (konto >= "2640" && konto <= "2649") {
          if (row.debit) report.ruta48 += row.debit
        }
      })
    })

    // Calculate sales base from VAT (reverse calculation)
    if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
    if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
    if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

    return recalculateVatReport(report)
  },

  /**
   * Calculate VAT report from transactions for a given period.
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
          // Utgående moms
          if (t.vatRate === 25) report.ruta10 += t.vatAmount
          else if (t.vatRate === 12) report.ruta11 += t.vatAmount
          else if (t.vatRate === 6) report.ruta12 += t.vatAmount
        } else {
          // Ingående moms
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

    // Utgående moms from customer invoices
    customerInvoices
      .filter(inv => isInPeriod(inv.issueDate))
      .forEach(inv => {
        if (inv.vatAmount) {
          if (inv.vatRate === 25) report.ruta10 += inv.vatAmount
          else if (inv.vatRate === 12) report.ruta11 += inv.vatAmount
          else if (inv.vatRate === 6) report.ruta12 += inv.vatAmount
        }
      })

    // Ingående moms from supplier invoices
    supplierInvoices
      .filter(inv => isInPeriod(inv.invoiceDate))
      .forEach(inv => {
        report.ruta48 += inv.vatAmount
      })

    // Ingående moms from receipts
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
   */
  calculateFromRealVerifications(verifications: Verification[], period: string): VatReport {
    const { quarter, year } = parsePeriod(period)
    const startMonth = (quarter - 1) * 3
    const endMonth = startMonth + 2

    const dueDate = getVatDeadline(quarter, year)
    const today = new Date()
    let status: VatReport["status"] = "upcoming"
    if (today > dueDate) status = "overdue"

    const report = createEmptyVatReport(period, formatDate(dueDate), status)

    verifications.forEach(v => {
      const d = new Date(v.date)
      if (!isDateInQuarter(d, quarter, year)) return

      v.rows.forEach(row => {
        const konto = row.account
        const liabilityNet = (row.credit || 0) - (row.debit || 0)
        const assetNet = (row.debit || 0) - (row.credit || 0)

        if (konto >= "2610" && konto <= "2619") report.ruta10 += liabilityNet
        else if (konto >= "2620" && konto <= "2629") report.ruta11 += liabilityNet
        else if (konto >= "2630" && konto <= "2639") report.ruta12 += liabilityNet
        else if (konto >= "2640" && konto <= "2649") report.ruta48 += assetNet
      })
    })

    if (report.ruta10 > 0) report.ruta05 = Math.round(report.ruta10 / 0.25)
    if (report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
    if (report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

    return recalculateVatReport(report)
  },
}
