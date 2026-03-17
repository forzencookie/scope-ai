/**
 * Månadsavslut API
 *
 * GET: Returns monthly summaries for the fiscal year (verification count, revenue, expenses, status)
 * POST: Closes a month by locking all verifications in that period + syncing financialperiods
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from '@/lib/database/auth'
import { getFiscalYearRange } from '@/lib/bookkeeping/utils'

interface MonthlySummary {
    month: number        // 1-12
    year: number
    period: string       // "2026-01"
    label: string        // "Januari 2026"
    verificationCount: number
    revenue: number
    expenses: number
    result: number
    status: 'open' | 'closed'
}

const MONTH_NAMES_SV = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
]

/**
 * Build the list of fiscal months for a given fiscal year end.
 * Returns an array of { month (1-12), year, startDate, endDate } in fiscal order.
 */
function getFiscalMonths(fiscalYearEnd: string, referenceYear: number) {
    const fy = getFiscalYearRange(fiscalYearEnd, new Date(referenceYear, 5, 15)) // mid-year reference
    const startMonth = fy.start.getMonth() // 0-indexed
    const startYear = fy.start.getFullYear()

    const months: { month: number; year: number; startDate: string; endDate: string }[] = []
    for (let i = 0; i < 12; i++) {
        const m0 = (startMonth + i) % 12 // 0-indexed month
        const y = startYear + Math.floor((startMonth + i) / 12)
        const m = m0 + 1 // 1-indexed
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

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext()

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { supabase, userId, companyId } = ctx

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()

        // Fetch fiscal year end from company settings
        const { data: companyData } = await supabase
            .from('companies')
            .select('fiscal_year_end')
            .single()

        const fiscalYearEnd: string = companyData?.fiscal_year_end || '12-31'
        const fiscalMonths = getFiscalMonths(fiscalYearEnd, year)

        // Date range covering the entire fiscal year
        const fyStartDate = fiscalMonths[0].startDate
        const fyEndDate = fiscalMonths[fiscalMonths.length - 1].endDate

        // Fetch all verifications for the fiscal year
        const { data: verifications, error: vError } = await supabase
            .from('verifications')
            .select('id, date, is_locked')
            .gte('date', fyStartDate)
            .lte('date', fyEndDate)

        if (vError) throw vError

        // Fetch pending (unbookmarked) transaction counts
        const { data: pendingRows } = await supabase
            .from('transactions')
            .select('date')
            .eq('status', 'Att bokföra')
            .gte('date', fyStartDate)
            .lte('date', fyEndDate)

        // Build a map of "YYYY-MM" → count
        const pendingTransactions: Record<string, number> = {}
        if (pendingRows) {
            for (const row of pendingRows) {
                const key = (row.date as string).substring(0, 7) // "YYYY-MM"
                pendingTransactions[key] = (pendingTransactions[key] || 0) + 1
            }
        }

        // Fetch account balances per fiscal month (12 parallel calls)
        const monthBalancePromises = fiscalMonths.map(fm =>
            supabase.rpc('get_account_balances', {
                p_date_from: fm.startDate,
                p_date_to: fm.endDate,
            })
        )

        const monthBalances = await Promise.all(monthBalancePromises)

        // Build monthly summaries
        const summaries: MonthlySummary[] = fiscalMonths.map((fm, i) => {
            const period = `${fm.year}-${String(fm.month).padStart(2, '0')}`

            // Count verifications for this month
            const monthVerifications = (verifications || []).filter(v => {
                const d = v.date as string
                return d.startsWith(period)
            })

            // Check if month is closed (all verifications locked)
            const allLocked = monthVerifications.length > 0 && monthVerifications.every(v => v.is_locked)

            // Calculate revenue and expenses from balances
            const balanceData = monthBalances[i]?.data || []
            let revenue = 0
            let expenses = 0

            for (const row of balanceData) {
                const acc = Number(row.account_number)
                const balance = row.balance as number
                if (acc >= 3000 && acc <= 3999) {
                    revenue += Math.abs(balance) // Revenue is credit-normal
                } else if (acc >= 4000 && acc <= 8999) {
                    expenses += balance // Expenses are debit-normal
                }
            }

            return {
                month: fm.month,
                year: fm.year,
                period,
                label: `${MONTH_NAMES_SV[fm.month - 1]} ${fm.year}`,
                verificationCount: monthVerifications.length,
                revenue,
                expenses,
                result: revenue - expenses,
                status: allLocked ? 'closed' as const : 'open' as const,
            }
        })

        return NextResponse.json({ summaries, year, pendingTransactions })
    } catch (error) {
        console.error("Failed to fetch monthly summaries:", error)
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext()

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { supabase, userId, companyId } = ctx

        const body = await request.json()
        const { year, month, action } = body as { year: number; month: number; action: 'close' | 'reopen' }

        if (!year || !month || !action) {
            return NextResponse.json({ error: 'year, month, and action required' }, { status: 400 })
        }

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        const isLocked = action === 'close'

        // Lock/unlock all verifications in the period
        const { data, error } = await supabase
            .from('verifications')
            .update({ is_locked: isLocked })
            .gte('date', startDate)
            .lte('date', endDate)
            .select('id')

        if (error) throw error

        // Sync financialperiods table for consistent period locking
        const periodId = `${year}-M${String(month).padStart(2, '0')}`
        const monthName = MONTH_NAMES_SV[month - 1]
        if (companyId) {
            const { error: fpError } = await supabase
                .from('financial_periods')
                .upsert({
                    id: periodId,
                    company_id: companyId,
                    name: `${monthName} ${year}`,
                    start_date: startDate,
                    end_date: endDate,
                    status: isLocked ? 'closed' : 'open',
                    locked_at: isLocked ? new Date().toISOString() : null,
                    locked_by: isLocked ? userId : null,
                }, { onConflict: 'id' })

            if (fpError) {
                console.warn('Failed to sync financialperiods:', fpError)
                // Non-fatal: verification locking is the primary mechanism
            }
        }

        const count = data?.length || 0
        const label = `${MONTH_NAMES_SV[month - 1]} ${year}`

        return NextResponse.json({
            success: true,
            message: isLocked
                ? `${label} stängd. ${count} verifikationer låsta.`
                : `${label} öppnad. ${count} verifikationer upplåsta.`,
            affectedCount: count,
        })
    } catch (error) {
        console.error("Failed to update monthly closing:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
