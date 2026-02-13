/**
 * Accruals API (Periodisering)
 * 
 * POST /api/accruals — preview or execute accrual entries
 * 
 * Body:
 *   totalAmount: number (required)
 *   description: string (required)
 *   expenseAccount: string (required) — BAS account number
 *   expenseAccountName: string (optional)
 *   type: 'prepaid_expense' | 'accrued_expense' | 'accrued_revenue' (required)
 *   startPeriod: string (required) — YYYY-MM
 *   endPeriod: string (required) — YYYY-MM
 *   execute: boolean (optional) — if true, persist entries; if false/missing, return preview
 */

import { NextRequest, NextResponse } from 'next/server'
import { accrualService, type AccrualInput } from '@/services/accrual-service'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { totalAmount, description, expenseAccount, expenseAccountName, type, startPeriod, endPeriod, execute } = body

        if (!totalAmount || !description || !expenseAccount || !type || !startPeriod || !endPeriod) {
            return NextResponse.json(
                { error: 'Alla fält krävs: totalAmount, description, expenseAccount, type, startPeriod, endPeriod' },
                { status: 400 }
            )
        }

        const input: AccrualInput = {
            totalAmount: Number(totalAmount),
            description,
            expenseAccount,
            expenseAccountName,
            type,
            startPeriod,
            endPeriod,
        }

        if (execute) {
            const result = await accrualService.executeAccrual(input)
            return NextResponse.json({
                success: true,
                ...result,
                message: `Periodisering skapad: ${result.periodCount} verifikationer, ${result.monthlyAmount.toLocaleString('sv-SE')} kr/mån.`,
            })
        } else {
            const preview = accrualService.previewAccrual(input)
            return NextResponse.json(preview)
        }
    } catch (error) {
        console.error('Failed to handle accrual:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Något gick fel' },
            { status: 500 }
        )
    }
}
