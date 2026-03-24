/**
 * Supplier Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with VAT handling and source tracking.
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server"
import { verificationService } from '@/services/accounting/verification-service'
import { createPurchaseEntry } from '@/lib/bookkeeping'
import type { BookingData } from '@/types'
import type { SwedishVatRate } from '@/lib/bookkeeping'
import { nullToUndefined } from '@/lib/utils'

export const POST = withAuthParams(async (request: NextRequest, { supabase }, { id }) => {
    const body = (await request.json()) as BookingData & { accountingMethod?: 'cash' | 'invoice' }

    // Fetch the invoice to get details
    const { data: invoice } = await supabase
        .from('supplier_invoices')
        .select('*')
        .eq('id', id)
        .single();

    const amount = invoice ? Number(invoice.total_amount) || 0 : (body.amount || 0);

    // Use the bookkeeping engine for proper VAT-split journal entries
    const journalEntry = createPurchaseEntry({
        date: new Date().toISOString().split('T')[0],
        description: body.description || `Lev.faktura bokföring`,
        grossAmount: amount,
        expenseAccount: body.debitAccount,
        vatRate: ((body as unknown as Record<string, unknown>).vatRate as number || 0) as SwedishVatRate,
        liabilityAccount: body.creditAccount || '2440',
        invoiceReference: nullToUndefined(invoice?.invoice_number),
        series: 'B',
        accountingMethod: body.accountingMethod,
    });

    // Create verification directly
    const verification = await verificationService.createVerification({
        series: 'B',
        date: journalEntry.date,
        description: journalEntry.description,
        entries: journalEntry.rows.map(row => ({
            account: row.account,
            debit: row.debit,
            credit: row.credit,
            description: row.description,
        })),
        sourceType: 'supplier_invoice',
        sourceId: id,
    }, supabase);

    // Update supplier invoice status
    if (invoice) {
        await supabase
            .from('supplier_invoices')
            .update({ status: 'Bokförd' })
            .eq('id', id);
    }

    return NextResponse.json({
        verificationId: verification.id,
        verificationNumber: `${verification.series}${verification.number}`,
    })
})
