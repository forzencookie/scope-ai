/**
 * Receipt Booking API
 *
 * POST: Creates a pending booking from a receipt (journal entry)
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from '@/lib/database/auth'
import { pendingBookingService } from '@/services/pending-booking-service'
import { createSimpleEntry } from '@/lib/bookkeeping'
import type { SwedishVatRate } from '@/lib/bookkeeping'
import type { VerificationEntry } from '@/services/verification-service'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const ctx = await getAuthContext()

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { supabase } = ctx;

        const { data: receipt } = await supabase
            .from('receipts')
            .select('*')
            .eq('id', id)
            .single()

        if (!receipt) {
            return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
        }

        const body = await request.json()
        const { debitAccount, creditAccount, description, vatRate } = body

        if (!debitAccount || !creditAccount) {
            return NextResponse.json(
                { error: 'Debit and Credit accounts are required' },
                { status: 400 }
            )
        }

        const amount = Math.abs(Number(receipt.amount) || Number(receipt.total_amount) || 0)
        const receiptDate = receipt.date || new Date().toISOString().split('T')[0]

        // Generate journal entry via bookkeeping engine
        const journalEntry = createSimpleEntry({
            date: receiptDate,
            description: description || receipt.supplier || 'Kvitto',
            amount,
            debitAccount,
            creditAccount,
            vatRate: (vatRate || 0) as SwedishVatRate,
            isIncome: false,
            series: 'A',
        })

        const entries: VerificationEntry[] = journalEntry.rows.map(row => ({
            account: row.account,
            debit: row.debit,
            credit: row.credit,
            description: row.description,
        }))

        // Create pending booking
        const pending = await pendingBookingService.createPendingBooking({
            sourceType: 'receipt',
            sourceId: id,
            description: journalEntry.description,
            entries,
            series: 'A',
            date: journalEntry.date,
            metadata: {
                supplier: receipt.supplier,
                amount,
                category: receipt.category,
            },
        })

        // Update receipt status
        await supabase
            .from('receipts')
            .update({ status: 'recorded' })
            .eq('id', id)

        return NextResponse.json({
            success: true,
            pendingBookingId: pending.id,
        })
    } catch (error) {
        console.error(`Failed to book receipt ${id}:`, error)
        const message = error instanceof Error ? error.message : 'Failed to book receipt'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
