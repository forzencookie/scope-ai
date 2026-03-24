/**
 * Invoice Payment API
 *
 * Records customer payment on a booked invoice.
 * Uses the bookkeeping engine to create proper payment journal entries.
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server";
import { verificationService } from '@/services/accounting/verification-service';
import { createPaymentReceivedEntry } from '@/lib/bookkeeping';
import { nullToUndefined } from '@/lib/utils';

export const POST = withAuthParams(async (_req: NextRequest, { supabase }, { id }) => {
    const { data: invoice } = await supabase
        .from('customer_invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (!invoice) {
        return ApiResponse.notFound('Invoice not found');
    }

    if (invoice.status === 'betald') {
        return ApiResponse.badRequest('Invoice already paid');
    }

    const total = Number(invoice.total_amount) || 0;

    // Use the bookkeeping engine for payment received entry
    const journalEntry = createPaymentReceivedEntry({
        date: new Date().toISOString().split('T')[0],
        description: `Betalning faktura ${invoice.invoice_number || id} - ${invoice.customer_name}`,
        amount: total,
        invoiceReference: nullToUndefined(invoice.invoice_number),
        series: 'A',
    });

    // Create verification directly
    const verification = await verificationService.createVerification({
        series: 'A',
        date: journalEntry.date,
        description: journalEntry.description,
        entries: journalEntry.rows.map(row => ({
            account: row.account,
            debit: row.debit,
            credit: row.credit,
            description: row.description,
        })),
        sourceType: 'invoice_payment',
        sourceId: id,
    }, supabase);

    // Update invoice status to Betald
    await supabase
        .from('customer_invoices')
        .update({ status: 'Betald' })
        .eq('id', id);

    return NextResponse.json({
        verificationId: verification.id,
        verificationNumber: `${verification.series}${verification.number}`,
    });
})
