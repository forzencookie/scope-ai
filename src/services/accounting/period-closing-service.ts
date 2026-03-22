/**
 * Period Closing Service (Månadsavslut)
 *
 * Manages monthly period closings for Swedish accounting:
 * - Build fiscal month ranges from a fiscal year end date
 * - Aggregate monthly summaries (verifications, revenue, expenses, result)
 * - Close/reopen months by locking/unlocking verifications and syncing financial_periods
 *
 * Not to be confused with closing-entry-service.ts which handles year-end
 * closing entries (bokslutsposter), not period management.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getFiscalYearRange } from '@/lib/bookkeeping/utils'

// =============================================================================
// Types
// =============================================================================

export interface MonthlySummary {
    month: number
    year: number
    period: string
    label: string
    verificationCount: number
    revenue: number
    expenses: number
    result: number
    status: 'open' | 'closed'
}

interface FiscalMonth {
    month: number
    year: number
    startDate: string
    endDate: string
}

// =============================================================================
// Constants
// =============================================================================

const MONTH_NAMES_SV = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
]

// =============================================================================
// Helpers
// =============================================================================

/**
 * Build the list of 12 fiscal months for a given fiscal year end.
 * Returns months in fiscal order with date range strings.
 */
function getFiscalMonths(fiscalYearEnd: string, referenceYear: number): FiscalMonth[] {
    const fy = getFiscalYearRange(fiscalYearEnd, new Date(referenceYear, 5, 15))
    const startMonth = fy.start.getMonth() // 0-indexed
    const startYear = fy.start.getFullYear()

    const months: FiscalMonth[] = []
    for (let i = 0; i < 12; i++) {
        const m0 = (startMonth + i) % 12
        const y = startYear + Math.floor((startMonth + i) / 12)
        const m = m0 + 1
        const lastDay = new Date(y, m, 0).getDate()
        months.push({
            month: m,
            year: y,
            startDate: `${y}-${String(m).padStart(2, '0')}-01`,
            endDate: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        })
    }
    return months
}

/**
 * Classify account balances into revenue and expenses.
 * Revenue: accounts 3000-3999 (credit-normal, use absolute value)
 * Expenses: accounts 4000-8999 (debit-normal)
 */
function classifyBalances(balanceData: Array<{ account_number: unknown; balance: unknown }>): {
    revenue: number
    expenses: number
} {
    let revenue = 0
    let expenses = 0

    for (const row of balanceData) {
        const acc = Number(row.account_number)
        const balance = row.balance as number
        if (acc >= 3000 && acc <= 3999) {
            revenue += Math.abs(balance)
        } else if (acc >= 4000 && acc <= 8999) {
            expenses += balance
        }
    }

    return { revenue, expenses }
}

// =============================================================================
// Service
// =============================================================================

export const periodClosingService = {
    /**
     * Get monthly summaries for a fiscal year.
     * Fetches verifications, pending transactions, and account balances,
     * then aggregates into per-month summaries.
     */
    async getMonthlySummaries(
        fiscalYearEnd: string,
        year: number,
        client: SupabaseClient<Database>,
    ): Promise<{ summaries: MonthlySummary[]; pendingTransactions: Record<string, number> }> {
        const fiscalMonths = getFiscalMonths(fiscalYearEnd, year)
        const fyStartDate = fiscalMonths[0].startDate
        const fyEndDate = fiscalMonths[fiscalMonths.length - 1].endDate

        // Parallel: verifications, pending transactions, and per-month account balances
        const [verificationsResult, pendingResult, ...monthBalances] = await Promise.all([
            client
                .from('verifications')
                .select('id, date, is_locked')
                .gte('date', fyStartDate)
                .lte('date', fyEndDate),
            client
                .from('transactions')
                .select('date')
                .eq('status', 'Obokförd')
                .gte('date', fyStartDate)
                .lte('date', fyEndDate),
            ...fiscalMonths.map(fm =>
                client.rpc('get_account_balances', {
                    p_date_from: fm.startDate,
                    p_date_to: fm.endDate,
                }),
            ),
        ])

        if (verificationsResult.error) throw verificationsResult.error

        // Build pending transactions map
        const pendingTransactions: Record<string, number> = {}
        if (pendingResult.data) {
            for (const row of pendingResult.data) {
                const key = (row.date as string).substring(0, 7)
                pendingTransactions[key] = (pendingTransactions[key] || 0) + 1
            }
        }

        const verifications = verificationsResult.data || []

        // Build monthly summaries
        const summaries: MonthlySummary[] = fiscalMonths.map((fm, i) => {
            const period = `${fm.year}-${String(fm.month).padStart(2, '0')}`

            const monthVerifications = verifications.filter(v =>
                (v.date as string).startsWith(period),
            )

            const allLocked =
                monthVerifications.length > 0 && monthVerifications.every(v => v.is_locked)

            const balanceData = monthBalances[i]?.data || []
            const { revenue, expenses } = classifyBalances(balanceData)

            return {
                month: fm.month,
                year: fm.year,
                period,
                label: `${MONTH_NAMES_SV[fm.month - 1]} ${fm.year}`,
                verificationCount: monthVerifications.length,
                revenue,
                expenses,
                result: revenue - expenses,
                status: allLocked ? ('closed' as const) : ('open' as const),
            }
        })

        return { summaries, pendingTransactions }
    },

    /**
     * Close or reopen a month by locking/unlocking all verifications in the period,
     * and syncing the financial_periods table.
     */
    async toggleMonthStatus(
        params: {
            year: number
            month: number
            action: 'close' | 'reopen'
            companyId: string
            userId: string
        },
        client: SupabaseClient<Database>,
    ): Promise<{ message: string; affectedCount: number }> {
        const { year, month, action, companyId, userId } = params
        const isLocked = action === 'close'

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // Lock/unlock all verifications in the period
        const { data, error } = await client
            .from('verifications')
            .update({ is_locked: isLocked })
            .gte('date', startDate)
            .lte('date', endDate)
            .select('id')

        if (error) throw error

        // Sync financial_periods table
        const periodId = `${year}-M${String(month).padStart(2, '0')}`
        const monthName = MONTH_NAMES_SV[month - 1]

        const { error: fpError } = await client
            .from('financial_periods')
            .upsert(
                {
                    id: periodId,
                    company_id: companyId,
                    name: `${monthName} ${year}`,
                    start_date: startDate,
                    end_date: endDate,
                    status: isLocked ? 'closed' : 'open',
                    locked_at: isLocked ? new Date().toISOString() : null,
                    locked_by: isLocked ? userId : null,
                },
                { onConflict: 'id' },
            )

        if (fpError) {
            // Non-fatal: verification locking is the primary mechanism
            console.warn('Failed to sync financial_periods:', fpError)
        }

        const count = data?.length || 0
        const label = `${MONTH_NAMES_SV[month - 1]} ${year}`

        return {
            message: isLocked
                ? `${label} stängd. ${count} verifikationer låsta.`
                : `${label} öppnad. ${count} verifikationer upplåsta.`,
            affectedCount: count,
        }
    },
}
