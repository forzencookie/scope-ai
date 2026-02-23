/**
 * VAT Report Hook — Momsdeklaration data layer
 *
 * Aggregates verifications by VAT account to produce
 * Skatteverket momsdeklaration box values.
 *
 * VAT accounts (BAS):
 *   Output VAT: 2610 (25%), 2620 (12%), 2630 (6%)
 *   Input VAT:  2640
 *   Sales by rate: class 3xxx rows paired with VAT rows
 */

import { useMemo } from 'react'
import { useVerifications, type Verification } from './use-verifications'

export interface VatReportData {
  /** Box 05: Momspliktig försäljning 25% */
  sales25: number
  /** Box 06: Momspliktig försäljning 12% */
  sales12: number
  /** Box 07: Momspliktig försäljning 6% */
  sales6: number
  /** Box 08: Momsfri försäljning */
  salesExempt: number
  /** Box 10: Utgående moms 25% */
  outputVat25: number
  /** Box 11: Utgående moms 12% */
  outputVat12: number
  /** Box 12: Utgående moms 6% */
  outputVat6: number
  /** Box 48: Ingående moms */
  inputVat: number
  /** Total output VAT (boxes 10+11+12) */
  outputVatTotal: number
  /** VAT payable = output - input (positive = owe SKV) */
  vatPayable: number
  /** Total sales across all rates */
  totalSales: number
  isLoading: boolean
}

interface UseVatReportOptions {
  /** Year to report */
  year: number
  /** Period: month (1-12) for monthly, quarter (1-4) for quarterly, or undefined for full year */
  period?: number
  /** Frequency to determine period interpretation */
  frequency?: 'monthly' | 'quarterly' | 'annually'
}

export function useVatReport(options: UseVatReportOptions): VatReportData {
  const { year, period, frequency = 'quarterly' } = options
  const { verifications, isLoading } = useVerifications()

  const report = useMemo(() => {
    const empty: Omit<VatReportData, 'isLoading'> = {
      sales25: 0, sales12: 0, sales6: 0, salesExempt: 0,
      outputVat25: 0, outputVat12: 0, outputVat6: 0,
      inputVat: 0, outputVatTotal: 0, vatPayable: 0, totalSales: 0,
    }

    if (!verifications || verifications.length === 0) return empty

    // Filter verifications to the requested period
    const filtered = verifications.filter((v: Verification) => {
      const d = new Date(v.date)
      if (d.getFullYear() !== year) return false
      if (period === undefined) return true

      const month = d.getMonth() + 1 // 1-based

      if (frequency === 'monthly') {
        return month === period
      }
      if (frequency === 'quarterly') {
        const q = Math.ceil(month / 3)
        return q === period
      }
      // annually: full year
      return true
    })

    let outputVat25 = 0
    let outputVat12 = 0
    let outputVat6 = 0
    let inputVat = 0
    let sales25 = 0
    let sales12 = 0
    let sales6 = 0
    let salesExempt = 0

    for (const v of filtered) {
      // Track which VAT accounts appear in this verification
      let hasVat25 = false
      let hasVat12 = false
      let hasVat6 = false
      let verRevenue = 0

      for (const row of v.rows) {
        const acc = parseInt(row.account)
        // Credit amount (positive = output VAT booked as credit)
        const creditNet = row.credit - row.debit

        // Output VAT accounts — credit-normal, so creditNet is positive
        if (acc === 2610 || (acc >= 2610 && acc <= 2619)) {
          outputVat25 += creditNet
          hasVat25 = true
        } else if (acc === 2620 || (acc >= 2620 && acc <= 2629)) {
          outputVat12 += creditNet
          hasVat12 = true
        } else if (acc === 2630 || (acc >= 2630 && acc <= 2639)) {
          outputVat6 += creditNet
          hasVat6 = true
        }
        // Input VAT — debit-normal, so debit - credit is positive
        else if (acc === 2640 || (acc >= 2640 && acc <= 2649)) {
          inputVat += (row.debit - row.credit)
        }
        // Revenue accounts (3xxx) — track for sales breakdown
        else if (acc >= 3000 && acc <= 3999) {
          verRevenue += creditNet // credit-normal = positive
        }
      }

      // Attribute revenue to the correct VAT rate bucket
      if (hasVat25) sales25 += verRevenue
      else if (hasVat12) sales12 += verRevenue
      else if (hasVat6) sales6 += verRevenue
      else if (verRevenue > 0) salesExempt += verRevenue
    }

    const outputVatTotal = outputVat25 + outputVat12 + outputVat6
    const totalSales = sales25 + sales12 + sales6 + salesExempt

    return {
      sales25, sales12, sales6, salesExempt,
      outputVat25, outputVat12, outputVat6,
      inputVat,
      outputVatTotal,
      vatPayable: outputVatTotal - inputVat,
      totalSales,
    }
  }, [verifications, year, period, frequency])

  return { ...report, isLoading }
}
