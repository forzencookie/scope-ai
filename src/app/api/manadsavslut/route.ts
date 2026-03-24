/**
 * Månadsavslut API
 *
 * GET: Returns monthly summaries for the fiscal year (verification count, revenue, expenses, status)
 * POST: Closes or reopens a month by locking/unlocking verifications
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuth, ApiResponse } from "@/lib/database/auth-server"
import { periodClosingService } from "@/services/accounting/period-closing-service"

export const GET = withAuth(async (request, { supabase }) => {
    try {
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
        return ApiResponse.serverError("Failed to fetch")
    }
})

export const POST = withAuth(async (request, { supabase, userId, companyId }) => {
    try {
        const body = await request.json()
        const { year, month, action } = body as { year: number; month: number; action: 'close' | 'reopen' }

        if (!year || !month || !action) {
            return ApiResponse.badRequest('year, month, and action required')
        }

        if (!companyId) {
            return ApiResponse.badRequest('No company selected')
        }

        const result = await periodClosingService.toggleMonthStatus(
            { year, month, action, companyId, userId },
            supabase,
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error("Failed to update monthly closing:", error)
        return ApiResponse.serverError("Failed to update")
    }
})
