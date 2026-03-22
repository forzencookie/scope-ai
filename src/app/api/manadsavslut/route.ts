/**
 * Månadsavslut API
 *
 * GET: Returns monthly summaries for the fiscal year (verification count, revenue, expenses, status)
 * POST: Closes or reopens a month by locking/unlocking verifications
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/database/auth-server"
import { periodClosingService } from "@/services/accounting/period-closing-service"

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext()
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { supabase } = ctx
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()

        const { data: companyData } = await supabase
            .from('companies')
            .select('fiscal_year_end')
            .single()

        const fiscalYearEnd: string = companyData?.fiscal_year_end || '12-31'
        const { summaries, pendingTransactions } = await periodClosingService.getMonthlySummaries(
            fiscalYearEnd, year, supabase,
        )

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

        if (!companyId) {
            return NextResponse.json({ error: 'No company selected' }, { status: 400 })
        }

        const result = await periodClosingService.toggleMonthStatus(
            { year, month, action, companyId, userId },
            supabase,
        )

        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error("Failed to update monthly closing:", error)
        return NextResponse.json({ error: "Failed to update" }, { status: 500 })
    }
}
