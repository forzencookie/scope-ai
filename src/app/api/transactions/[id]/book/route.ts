import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { pendingBookingService } from '@/services/pending-booking-service'
import { verificationService, type VerificationEntry } from '@/services/verification-service'
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

        // 1b. Check period lock
        const txDate = transaction.date || new Date().toISOString().split('T')[0]
        const locked = await verificationService.isPeriodLocked(txDate)
        if (locked) {
            return NextResponse.json(
                { success: false, error: 'Perioden är låst. Kan inte bokföra i en stängd period.' },
                { status: 403 }
            )
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

        // 4. Create pending booking instead of auto-verification
        const pending = await pendingBookingService.createPendingBooking({
            sourceType: 'transaction',
            sourceId: id,
            description: journalEntry.description,
            entries,
            series: 'A',
            date: journalEntry.date,
            metadata: {
                category,
                amount,
                isIncome,
                transactionDescription: transaction.description,
            },
        })

        // 5. Update Transaction category (but NOT status — that happens on booking confirmation)
        await userDb.transactions.update(id, {
            category: category,
        })

        return NextResponse.json({
            success: true,
            pendingBookingId: pending.id,
        })

    } catch (error) {
        console.error(`Failed to book transaction ${id}:`, error)
        const message = error instanceof Error ? error.message : 'Failed to book transaction';

        if (message.includes('balanserar inte')) {
            return NextResponse.json({ success: false, error: message }, { status: 422 });
        }
        if (message.includes('redan bokförd') || message.includes('already')) {
            return NextResponse.json({ success: false, error: message }, { status: 409 });
        }

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}
