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
    // Output VAT: 2610-2639
    // Input VAT: 2640-2649
    // Sales (Bases): 3000-3399 (Box 05), 3xxx Exempt (Box 42)
    // Purchases (Reverse Charge Bases): 4515 (Box 20), 4535 (Box 21)

    periodTransactions.forEach(v => {
      if (!v.rows) return

      v.rows.forEach(row => {
        const konto = row.account
        const credit = row.credit || 0
        const debit = row.debit || 0
        const netCredit = credit - debit
        const netDebit = debit - credit

        // 1. VAT ACCOUNTS (Moms)
        // Output VAT 25% (2610-2619)
        if (konto >= "2610" && konto <= "2619") {
          report.ruta10 += credit // Usually credit for output VAT
        }
        // Output VAT 12% (2620-2629)
        else if (konto >= "2620" && konto <= "2629") {
          report.ruta11 += credit
        }
        // Output VAT 6% (2630-2639)
        else if (konto >= "2630" && konto <= "2639") {
          report.ruta12 += credit
        }
        // Input VAT (2640-2649)
        else if (konto >= "2640" && konto <= "2649") {
          report.ruta48 += debit // Usually debit for input VAT
        }

        // 2. SALES BASES (Försäljning) - Net Credit
        // Box 05: Momspliktig försäljning 25% (Standard 3000-3099, 3100-3199 varies but often 25%)
        if ((konto >= "3000" && konto <= "3099") || (konto >= "3100" && konto <= "3399")) {
          report.ruta05 += netCredit
        }
        // Box 42: Momsfri försäljning (Approved exempt accounts range) e.g. 36xx, 37xx often used for exempt
        // Or specific accounts for EU sales (Box 35, 39 etc)
        // Simple heuristic for now: If it's a 3-series account but NOT caught above, put in 42?
        // Better: Explicitly map common "Momsfri" accounts.
        else if (konto.startsWith("3") && !((konto >= "3000" && konto <= "3399"))) {
          // 3600-3699 Internt/Sidointäkter often exempt or 3900 Övrigt
          report.ruta42 += netCredit
        }


        // 3. PURCHASE BASES (Inköp / Reverse Charge) - Net Debit
        // Box 20: Goods from EU
        if (konto === "4515") {
          report.ruta20 += netDebit
        }
        // Box 21: Services from EU (e.g. Google/Facebook Ads) - Account 4535
        else if (konto === "4535") {
          report.ruta21 += netDebit
        }
        // Box 22: Services from outside EU - Account 4531
        else if (konto === "4531") {
          report.ruta22 += netDebit
        }

      })
    })

    // Note: We NO LONGER reverse-calculate 05, 06, 07 from the VAT. 
    // We rely on the actual booking accounts.
    // However, for 12% and 6% sales (Box 06, 07), we might need specific account ranges
    // or we can fallback to the reverse calc ONLY if the account scan didn't find anything 
    // to avoid breaking legacy data that might not use standard accounts.

    // Fallback: If Box 06 is empty but we have Box 11 (12% VAT), guess based on VAT
    if (report.ruta06 === 0 && report.ruta11 > 0) report.ruta06 = Math.round(report.ruta11 / 0.12)
    if (report.ruta07 === 0 && report.ruta12 > 0) report.ruta07 = Math.round(report.ruta12 / 0.06)

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
