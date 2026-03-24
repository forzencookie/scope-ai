import { NextRequest, NextResponse } from "next/server"
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server"
import { bookTransaction } from '@/services/accounting/transactions'

export const POST = withAuthParams(async (request: NextRequest, { supabase, userId }, { id }) => {
    const body = await request.json()
    const { category, debitAccount, creditAccount, description, vatRate } = body

    if (!debitAccount || !creditAccount) {
        return ApiResponse.badRequest('Debit and Credit accounts are required')
    }

    const result = await bookTransaction(id, userId, {
        category,
        debitAccount,
        creditAccount,
        description,
        vatRate
    }, supabase)

    if (!result.success) {
        const status = result.error?.includes('låst') ? 403 :
                       result.error?.includes('balanserar inte') ? 422 :
                       result.error?.includes('hittades inte') ? 404 : 500
        return NextResponse.json(result, { status })
    }

    return NextResponse.json(result)
})
