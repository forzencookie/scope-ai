import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/database/auth-server"
import { bookTransaction } from '@/services/transactions'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, user } = ctx;

        const body = await request.json()
        const { category, debitAccount, creditAccount, description, vatRate } = body

        if (!debitAccount || !creditAccount) {
            return NextResponse.json(
                { success: false, error: 'Debit and Credit accounts are required' },
                { status: 400 }
            )
        }

        const result = await bookTransaction(id, user.id, {
            category,
            debitAccount,
            creditAccount,
            description,
            vatRate
        }, supabase)

        if (!result.success) {
            const status = result.error?.includes('låst') ? 403 : 
                           result.error?.includes('balanserar inte') ? 422 : 
                           result.error?.includes('hittades inte') ? 404 : 500;
            return NextResponse.json(result, { status });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error(`Failed to book transaction ${id}:`, error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to book transaction' },
            { status: 500 }
        )
    }
}
