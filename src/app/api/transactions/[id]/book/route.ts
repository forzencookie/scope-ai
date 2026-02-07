import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { verificationService, VerificationEntry } from '@/services/verification-service'
import { createSimpleEntry } from '@/lib/bookkeeping'
import type { SwedishVatRate } from '@/lib/bookkeeping'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json()
        const { category, debitAccount, creditAccount, description, vatRate } = body

        if (!debitAccount || !creditAccount) {
            return NextResponse.json(
                { success: false, error: 'Debit and Credit accounts are required' },
                { status: 400 }
            )
        }

        // 1. Fetch the transaction to get details
        const transaction = await userDb.transactions.getById(id)
        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
        }

        const amount = Math.abs(Number(transaction.amount))
        const isIncome = Number(transaction.amount) > 0

        // 2. Use the bookkeeping engine to generate proper journal entries
        const journalEntry = createSimpleEntry({
            date: transaction.date || new Date().toISOString().split('T')[0],
            description: description || transaction.description || '',
            amount,
            debitAccount,
            creditAccount,
            vatRate: (vatRate || 0) as SwedishVatRate,
            isIncome,
            series: 'A',
        })

        // 3. Map engine output to verification entries
        const entries: VerificationEntry[] = journalEntry.rows.map(row => ({
            account: row.account,
            debit: row.debit,
            credit: row.credit,
            description: row.description,
        }))

        // 4. Create Verification with source tracking
        const verification = await verificationService.createVerification({
            series: 'A',
            date: journalEntry.date,
            description: journalEntry.description,
            entries,
            sourceType: 'transaction',
            sourceId: id,
        })

        // 5. Update Transaction Status
        const updated = await userDb.transactions.update(id, {
            status: 'Bokförd',
            category: category,
        })

        return NextResponse.json({
            success: true,
            data: {
                transaction: updated,
                verification: verification
            }
        })

    } catch (error) {
        console.error(`Failed to book transaction ${id}:`, error)
        return NextResponse.json(
            { success: false, error: 'Failed to book transaction' },
            { status: 500 }
        )
    }
}
