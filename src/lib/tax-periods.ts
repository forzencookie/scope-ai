/**
 * Tax Periods Helper Library
 * Centralized logic for calculating tax periods and deadlines.
 * All date logic lives here to maintain DRY principle.
 */

import { format, addMonths, subMonths, startOfQuarter, endOfQuarter, getMonth, getYear, setMonth, setDate, isBefore, isAfter, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'

// =============================================================================
// Types
// =============================================================================

export type VatFrequency = 'monthly' | 'quarterly' | 'annually'

export interface TaxPeriodInfo {
    periodName: string     // e.g., "Kvartal 4 2025" or "December 2025"
    deadline: string       // e.g., "12 feb 2026"
    startDate: Date
    endDate: Date
}

// =============================================================================
// VAT Period Calculation
// =============================================================================

/**
 * Get the next VAT reporting period based on frequency.
 * Swedish VAT deadlines:
 * - Monthly: 12th of next month (or 26th for large companies, simplified to 12th)
 * - Quarterly: 12th of month after quarter end
 * - Annually: 26th of second month after fiscal year end
 */
export function getNextVatPeriod(vatFrequency: VatFrequency, fiscalYearEnd: string = '12-31'): TaxPeriodInfo {
    const now = new Date()

    switch (vatFrequency) {
        case 'monthly': {
            // Current or previous month depending on if deadline passed
            const currentDeadline = setDate(now, 12)
            const targetMonth = isBefore(now, currentDeadline) ? subMonths(now, 1) : now

            const periodName = format(targetMonth, 'MMMM yyyy', { locale: sv })
            const deadlineDate = setDate(addMonths(targetMonth, 1), 12)

            return {
                periodName: periodName.charAt(0).toUpperCase() + periodName.slice(1),
                deadline: format(deadlineDate, 'd MMM yyyy', { locale: sv }),
                startDate: new Date(getYear(targetMonth), getMonth(targetMonth), 1),
                endDate: new Date(getYear(targetMonth), getMonth(targetMonth) + 1, 0),
            }
        }

        case 'quarterly': {
            // Find the quarter we should be reporting
            const quarterEnd = endOfQuarter(subMonths(now, 1))
            const quarterStart = startOfQuarter(quarterEnd)
            const quarter = Math.floor(getMonth(quarterEnd) / 3) + 1

            const periodName = `Q${quarter} ${getYear(quarterEnd)}`
            // Deadline is 12th of month after quarter end
            const deadlineDate = setDate(addMonths(quarterEnd, 1), 12)

            return {
                periodName,
                deadline: format(deadlineDate, 'd MMM yyyy', { locale: sv }),
                startDate: quarterStart,
                endDate: quarterEnd,
            }
        }

        case 'annually': {
            // Parse fiscal year end (MM-DD format)
            const [endMonth, endDay] = fiscalYearEnd.split('-').map(Number)
            const currentYear = getYear(now)

            // Determine which fiscal year we're reporting for
            const fyEndThisYear = new Date(currentYear, endMonth - 1, endDay)
            const reportingFY = isBefore(now, fyEndThisYear) ? currentYear - 1 : currentYear
            const fyEnd = new Date(reportingFY, endMonth - 1, endDay)
            const fyStart = new Date(reportingFY - 1, endMonth, 1)

            // Deadline is 26th of second month after fiscal year end
            const deadlineDate = setDate(addMonths(fyEnd, 2), 26)

            return {
                periodName: `Helår ${reportingFY}`,
                deadline: format(deadlineDate, 'd MMM yyyy', { locale: sv }),
                startDate: fyStart,
                endDate: fyEnd,
            }
        }
    }
}

// =============================================================================
// AGI Period Calculation (Always Monthly)
// =============================================================================

/**
 * Get the next AGI reporting period.
 * AGI is always monthly, deadline is 12th of following month.
 */
export function getNextAgiPeriod(): TaxPeriodInfo {
    const now = new Date()

    // Check if we've passed the 12th (deadline for previous month)
    const currentDeadline = setDate(now, 12)
    const targetMonth = isBefore(now, currentDeadline) ? subMonths(now, 1) : now

    const periodName = format(targetMonth, 'MMMM yyyy', { locale: sv })
    const deadlineDate = setDate(addMonths(targetMonth, 1), 12)

    return {
        periodName: periodName.charAt(0).toUpperCase() + periodName.slice(1),
        deadline: format(deadlineDate, 'd MMM yyyy', { locale: sv }),
        startDate: new Date(getYear(targetMonth), getMonth(targetMonth), 1),
        endDate: new Date(getYear(targetMonth), getMonth(targetMonth) + 1, 0),
    }
}

// =============================================================================
// Income Tax (Beskattningsår) Calculation
// =============================================================================

/**
 * Get the current tax year (beskattningsår) for annual returns like INK2.
 * For calendar year companies: Previous year until July 1 deadline.
 * For non-calendar: Based on fiscal year end.
 */
export function getCurrentBeskattningsar(fiscalYearEnd: string = '12-31'): {
    year: number
    deadlineDate: string
    deadlineLabel: string
} {
    const now = new Date()
    const currentYear = getYear(now)

    // Parse fiscal year end
    const [endMonth, endDay] = fiscalYearEnd.split('-').map(Number)
    const isCalendarYear = endMonth === 12 && endDay === 31

    if (isCalendarYear) {
        // Standard: Report previous year. Deadline is July 1.
        const julyDeadline = new Date(currentYear, 6, 1) // July 1
        const beskattningsar = isBefore(now, julyDeadline) ? currentYear - 1 : currentYear
        const deadline = new Date(beskattningsar + 1, 6, 1)

        return {
            year: beskattningsar,
            deadlineDate: format(deadline, 'yyyy-MM-dd'),
            deadlineLabel: format(deadline, 'd MMM yyyy', { locale: sv }),
        }
    } else {
        // Non-calendar fiscal year: 6 months after fiscal year end
        const fyEndThisYear = new Date(currentYear, endMonth - 1, endDay)
        const reportingFY = isBefore(now, fyEndThisYear) ? currentYear - 1 : currentYear
        const deadline = addMonths(new Date(reportingFY, endMonth - 1, endDay), 6)

        return {
            year: reportingFY,
            deadlineDate: format(deadline, 'yyyy-MM-dd'),
            deadlineLabel: format(deadline, 'd MMM yyyy', { locale: sv }),
        }
    }
}

// =============================================================================
// K10 Deadline Calculation
// =============================================================================

/**
 * Get the K10 filing deadline.
 * K10 is due May 2 for the previous tax year (same as personal income tax).
 */
export function getK10Deadline(beskattningsar: number): string {
    const deadline = new Date(beskattningsar + 1, 4, 2) // May 2
    return format(deadline, 'd MMM yyyy', { locale: sv })
}

// =============================================================================
// Helper: Format Period for Display
// =============================================================================

export function formatSwedishMonth(date: Date): string {
    const monthName = format(date, 'MMMM', { locale: sv })
    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

export function getCurrentPeriodFallback(): string {
    const now = new Date()
    return `${formatSwedishMonth(now)} ${getYear(now)}`
}
