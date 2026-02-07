/**
 * Månadsavslut API
 *
 * GET: Returns monthly summaries for the fiscal year (verification count, revenue, expenses, status)
 * POST: Closes a month by locking all verifications in that period
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

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

export async function GET(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb()

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()

        // Fetch all verifications for the year
        const { data: verifications, error: vError } = await userDb.client
            .from('verifications')
            .select('id, date, is_locked')
            .gte('date', `${year}-01-01`)
            .lte('date', `${year}-12-31`)

        if (vError) throw vError

        // Fetch account balances per month (12 parallel calls)
        const monthBalancePromises = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1
            const startDate = `${year}-${String(m).padStart(2, '0')}-01`
            const lastDay = new Date(year, m, 0).getDate()
            const endDate = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

            return userDb.client.rpc('get_account_balances', {
                p_start_date: startDate,
                p_end_date: endDate,
            })
        })

        const monthBalances = await Promise.all(monthBalancePromises)

        // Build monthly summaries
        const summaries: MonthlySummary[] = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1
            const period = `${year}-${String(m).padStart(2, '0')}`

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
                const acc = row.account_number as number
                const balance = row.balance as number
                if (acc >= 3000 && acc <= 3999) {
                    revenue += Math.abs(balance) // Revenue is credit-normal
                } else if (acc >= 4000 && acc <= 8999) {
                    expenses += balance // Expenses are debit-normal
                }
            }

            return {
                month: m,
                year,
                period,
                label: `${MONTH_NAMES_SV[i]} ${year}`,
                verificationCount: monthVerifications.length,
                revenue,
                expenses,
                result: revenue - expenses,
                status: allLocked ? 'closed' as const : 'open' as const,
            }
        })

        return NextResponse.json({ summaries, year })
    } catch (error) {
        console.error("Failed to fetch monthly summaries:", error)
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb()

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

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
        const { data, error } = await userDb.client
            .from('verifications')
            .update({ is_locked: isLocked })
            .gte('date', startDate)
            .lte('date', endDate)
            .select('id')

        if (error) throw error

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
