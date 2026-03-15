/**
 * Supplier Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with VAT handling and source tracking.
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/database/auth'
import { pendingBookingService } from '@/services/pending-booking-service'
import { createPurchaseEntry } from '@/lib/bookkeeping'
import type { BookingData } from '@/components/bokforing/dialogs/bokforing'
import type { SwedishVatRate } from '@/lib/bookkeeping'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;

        const body = (await request.json()) as BookingData & { accountingMethod?: 'cash' | 'invoice' }
        const { id } = await params

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
            invoiceReference: invoice?.invoice_number || undefined,
            series: 'B',
            accountingMethod: body.accountingMethod,
        });

        // Create pending booking instead of auto-verification
        const pending = await pendingBookingService.createPendingBooking({
            sourceType: 'supplier_invoice',
            sourceId: id,
            description: journalEntry.description,
            entries: journalEntry.rows.map(row => ({
                account: row.account,
                debit: row.debit,
                credit: row.credit,
                description: row.description,
            })),
            series: 'B',
            date: journalEntry.date,
            metadata: {
                invoiceNumber: invoice?.invoice_number,
                amount,
                supplierName: invoice?.supplier_name,
            },
        });

        return NextResponse.json({ success: true, pendingBookingId: pending.id })

    } catch (error) {
        console.error('Booking error:', error);
        const message = error instanceof Error ? error.message : 'Failed to book invoice';

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
