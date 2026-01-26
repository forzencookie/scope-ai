/**
 * VAT calculation utilities
 */

import type { VatReport } from './types'

/**
 * Get VAT deadline for a quarter
 */
export function getVatDeadline(quarter: number, year: number): Date {
  const deadline = new Date(year, 0, 1)
  deadline.setHours(12, 0, 0, 0)

  switch (quarter) {
    case 1: // Jan-Mar -> Deadline May 12th
      deadline.setMonth(4)
      deadline.setDate(12)
      break
    case 2: // Apr-Jun -> Deadline Aug 17th
      deadline.setMonth(7)
      deadline.setDate(17)
      break
    case 3: // Jul-Sep -> Deadline Nov 12th
      deadline.setMonth(10)
      deadline.setDate(12)
      break
    case 4: // Oct-Dec -> Deadline Feb 12th (next year)
      deadline.setFullYear(year + 1)
      deadline.setMonth(1)
      deadline.setDate(12)
      break
  }
  return deadline
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Creates an empty VatReport with all fields initialized to 0
 */
export function createEmptyVatReport(
  period: string,
  dueDate: string,
  status: VatReport["status"] = "upcoming"
): VatReport {
  return {
    period,
    dueDate,
    status,
    // Section A
    ruta05: 0, ruta06: 0, ruta07: 0, ruta08: 0,
    // Section B
    ruta10: 0, ruta11: 0, ruta12: 0,
    // Section C
    ruta20: 0, ruta21: 0, ruta22: 0, ruta23: 0, ruta24: 0,
    // Section D
    ruta30: 0, ruta31: 0, ruta32: 0,
    // Section E
    ruta35: 0, ruta36: 0, ruta37: 0, ruta38: 0, ruta39: 0, ruta40: 0, ruta41: 0, ruta42: 0,
    // Section F
    ruta48: 0,
    // Section G
    ruta49: 0,
    // Section H
    ruta50: 0, ruta60: 0, ruta61: 0, ruta62: 0,
    // Aggregates
    salesVat: 0, inputVat: 0, netVat: 0,
  }
}

/**
 * Recalculates derived fields (ruta49, salesVat, inputVat, netVat)
 */
export function recalculateVatReport(report: VatReport): VatReport {
  // Total output VAT = B + D + H output
  const salesVat =
    report.ruta10 + report.ruta11 + report.ruta12 +
    report.ruta30 + report.ruta31 + report.ruta32 +
    report.ruta60 + report.ruta61 + report.ruta62

  const inputVat = report.ruta48
  const netVat = salesVat - inputVat

  return {
    ...report,
    salesVat,
    inputVat,
    netVat,
    ruta49: netVat,
  }
}

/**
 * Parse period string into quarter and year
 */
export function parsePeriod(period: string): { quarter: number; year: number } {
  const [p, yearStr] = period.split(" ") // e.g., "Q4 2024"
  return {
    quarter: parseInt(p.replace("Q", "")),
    year: parseInt(yearStr),
  }
}

/**
 * Check if a date is within a quarter period
 */
export function isDateInQuarter(date: Date, quarter: number, year: number): boolean {
  const startMonth = (quarter - 1) * 3
  const endMonth = startMonth + 2
  
  return (
    date.getFullYear() === year &&
    date.getMonth() >= startMonth &&
    date.getMonth() <= endMonth
  )
}
