/**
 * Accrual Service (Periodisering)
 * 
 * Creates periodisering entries that allocate expenses across multiple periods.
 * Common use cases:
 * - Prepaid rent (förutbetalda kostnader)
 * - Accrued revenue (upplupen intäkt) 
 * - Insurance premiums
 * - Annual subscriptions paid upfront
 * 
 * Uses the Swedish BAS account plan:
 * - 1710: Förutbetalda kostnader (prepaid expenses)
 * - 1790: Övriga förutbetalda kostnader
 * - 2990: Upplupna kostnader (accrued expenses)
 * - 1790: Upplupna intäkter (accrued revenue)
 */

import { verificationService, type VerificationEntry } from './verification-service'

// =============================================================================
// Types
// =============================================================================

export type AccrualType = 'prepaid_expense' | 'accrued_expense' | 'accrued_revenue'

export interface AccrualInput {
    /** Total amount to spread across periods */
    totalAmount: number
    /** Description of the accrual */
    description: string
    /** The expense/revenue account (e.g., 5010 for rent) */
    expenseAccount: string
    expenseAccountName?: string
    /** Type of accrual */
    type: AccrualType
    /** Start period (YYYY-MM) */
    startPeriod: string
    /** End period (YYYY-MM) */
    endPeriod: string
}

export interface AccrualEntry {
    /** Period (YYYY-MM) */
    period: string
    /** Date of the entry (last day of the period) */
    date: string
    /** Amount allocated to this period */
    amount: number
    /** Journal entries */
    entries: VerificationEntry[]
    /** Description */
    description: string
}

export interface AccrualPreview {
    input: AccrualInput
    /** Monthly amount */
    monthlyAmount: number
    /** Number of periods */
    periodCount: number
    /** All entries that will be created */
    entries: AccrualEntry[]
}

export interface AccrualResult {
    verificationIds: string[]
    periodCount: number
    monthlyAmount: number
}

// =============================================================================
// Helpers
// =============================================================================

function getBalanceSheetAccount(type: AccrualType): { account: string; name: string } {
    switch (type) {
        case 'prepaid_expense':
            return { account: '1710', name: 'Förutbetalda kostnader' }
        case 'accrued_expense':
            return { account: '2990', name: 'Upplupna kostnader' }
        case 'accrued_revenue':
            return { account: '1790', name: 'Upplupna intäkter' }
    }
}

function getMonthsBetween(start: string, end: string): string[] {
    const [startYear, startMonth] = start.split('-').map(Number)
    const [endYear, endMonth] = end.split('-').map(Number)
    const months: string[] = []

    let year = startYear
    let month = startMonth

    while (year < endYear || (year === endYear && month <= endMonth)) {
        months.push(`${year}-${String(month).padStart(2, '0')}`)
        month++
        if (month > 12) {
            month = 1
            year++
        }
    }

    return months
}

function getLastDayOfMonth(period: string): string {
    const [year, month] = period.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

// =============================================================================
// Service
// =============================================================================

export const accrualService = {
    /**
     * Preview accrual entries without persisting.
     * Shows how the total amount will be spread across periods.
     */
    previewAccrual(input: AccrualInput): AccrualPreview {
        const periods = getMonthsBetween(input.startPeriod, input.endPeriod)
        if (periods.length === 0) {
            throw new Error('Ogiltig periodintervall')
        }

        const monthlyAmount = Math.round((input.totalAmount / periods.length) * 100) / 100
        const bsAccount = getBalanceSheetAccount(input.type)

        const entries: AccrualEntry[] = periods.map((period, index) => {
            // Handle rounding: last period gets the remainder
            const isLast = index === periods.length - 1
            const amount = isLast
                ? input.totalAmount - monthlyAmount * (periods.length - 1)
                : monthlyAmount

            const date = getLastDayOfMonth(period)
            let periodEntries: VerificationEntry[]

            if (input.type === 'prepaid_expense') {
                // Each period: Debit expense, Credit prepaid (release from balance sheet)
                periodEntries = [
                    {
                        account: input.expenseAccount,
                        accountName: input.expenseAccountName,
                        debit: Math.round(amount * 100) / 100,
                        credit: 0,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                    {
                        account: bsAccount.account,
                        accountName: bsAccount.name,
                        debit: 0,
                        credit: Math.round(amount * 100) / 100,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                ]
            } else if (input.type === 'accrued_expense') {
                // Each period: Debit expense, Credit accrued
                periodEntries = [
                    {
                        account: input.expenseAccount,
                        accountName: input.expenseAccountName,
                        debit: Math.round(amount * 100) / 100,
                        credit: 0,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                    {
                        account: bsAccount.account,
                        accountName: bsAccount.name,
                        debit: 0,
                        credit: Math.round(amount * 100) / 100,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                ]
            } else {
                // accrued_revenue: Debit accrued revenue, Credit revenue
                periodEntries = [
                    {
                        account: bsAccount.account,
                        accountName: bsAccount.name,
                        debit: Math.round(amount * 100) / 100,
                        credit: 0,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                    {
                        account: input.expenseAccount,
                        accountName: input.expenseAccountName,
                        debit: 0,
                        credit: Math.round(amount * 100) / 100,
                        description: `Periodisering ${period}: ${input.description}`,
                    },
                ]
            }

            return {
                period,
                date,
                amount: Math.round(amount * 100) / 100,
                entries: periodEntries,
                description: `Periodisering ${period}: ${input.description}`,
            }
        })

        return {
            input,
            monthlyAmount,
            periodCount: periods.length,
            entries,
        }
    },

    /**
     * Execute accrual — creates one verification per period.
     * All verifications use series "P" (periodisering).
     */
    async executeAccrual(input: AccrualInput): Promise<AccrualResult> {
        const preview = this.previewAccrual(input)
        const verificationIds: string[] = []

        for (const entry of preview.entries) {
            const v = await verificationService.createVerification({
                series: 'P',
                date: entry.date,
                description: entry.description,
                entries: entry.entries,
                sourceType: 'accrual',
            })
            verificationIds.push(v.id)
        }

        return {
            verificationIds,
            periodCount: preview.periodCount,
            monthlyAmount: preview.monthlyAmount,
        }
    },
}
