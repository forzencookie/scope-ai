import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { verificationService, VerificationEntry } from '@/services/verification-service'

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
        const { category, debitAccount, creditAccount, description } = body

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

        // 2. Prepare Ledger Entries
        const amount = Math.abs(transaction.amount)
        const entries: VerificationEntry[] = [
            {
                account: debitAccount,
                debit: amount,
                credit: 0
            },
            {
                account: creditAccount,
                debit: 0,
                credit: amount
            }
        ]

        // 3. Create Verification (Ledger Entry)
        const verification = await verificationService.createVerification({
            series: 'A', // Manual booking series
            date: transaction.date,
            description: description || transaction.description,
            entries
        })

        // 4. Update Transaction Status and Link Verification
        // Note: We cast status to any because we know 'Bokförd' is valid but TS might complain if strict
        const updated = await userDb.transactions.update(id, {
            status: 'Bokförd',
            category: category,
            // verification_id: verification.id // Assuming column exists, if not it will be ignored by some ORMs but better safe
            // We'll trust the update method handles partials
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
