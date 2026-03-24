/**
 * Receipt Booking API
 *
 * POST: Creates a verification (journal entry) directly from a receipt.
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server"
import { verificationService } from '@/services/accounting/verification-service'
import { createSimpleEntry } from '@/lib/bookkeeping'
import type { SwedishVatRate } from '@/lib/bookkeeping'
import type { VerificationEntry } from '@/types'

export const POST = withAuthParams(async (request: NextRequest, { supabase }, { id }) => {
    const { data: receipt } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .single()

    if (!receipt) {
        return ApiResponse.notFound('Receipt not found')
    }

    const body = await request.json()
    const { debitAccount, creditAccount, description, vatRate } = body

    if (!debitAccount || !creditAccount) {
        return ApiResponse.badRequest('Debit and Credit accounts are required')
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

    // Create verification directly
    const verification = await verificationService.createVerification({
        series: 'A',
        date: journalEntry.date,
        description: journalEntry.description,
        entries,
        sourceType: 'receipt',
        sourceId: id,
    }, supabase)

    // Update receipt status
    await supabase
        .from('receipts')
        .update({ status: 'Bokförd' })
        .eq('id', id)

    return NextResponse.json({
        verificationId: verification.id,
        verificationNumber: `${verification.series}${verification.number}`,
    })
})
