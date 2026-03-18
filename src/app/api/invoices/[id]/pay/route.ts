/**
 * Invoice Payment API
 *
 * Records customer payment on a booked invoice.
 * Uses the bookkeeping engine to create proper payment journal entries.
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";
import { pendingBookingService } from '@/services/pending-booking-service';
import { createPaymentReceivedEntry } from '@/lib/bookkeeping';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;
        const { id } = await params;

        const { data: invoice } = await supabase
            .from('customer_invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
        }

        const total = Number(invoice.total_amount) || 0;

        // Use the bookkeeping engine for payment received entry
        const journalEntry = createPaymentReceivedEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Betalning faktura ${invoice.invoice_number || id} - ${invoice.customer_name}`,
            amount: total,
            invoiceReference: invoice.invoice_number || undefined,
            series: 'A',
        });

        // Create pending booking instead of auto-verification
        const pending = await pendingBookingService.createPendingBooking({
            sourceType: 'invoice_payment',
            sourceId: id,
            description: journalEntry.description,
            entries: journalEntry.rows.map(row => ({
                account: row.account,
                debit: row.debit,
                credit: row.credit,
                description: row.description,
            })),
            series: 'A',
            date: journalEntry.date,
            metadata: {
                invoiceNumber: invoice.invoice_number,
                customerName: invoice.customer_name,
                total,
            },
        });

        // Update invoice status to Betald
        await supabase
            .from('customer_invoices')
            .update({ status: 'Betald' })
            .eq('id', id);

        return NextResponse.json({ success: true, pendingBookingId: pending.id });

    } catch (error: unknown) {
        console.error("Payment error:", error);
        const message = error instanceof Error ? error.message : 'Failed to pay invoice';

        if (message.includes('balanserar inte')) {
            return NextResponse.json({ error: message }, { status: 422 });
        }
        if (message.includes('redan') || message.includes('already')) {
            return NextResponse.json({ error: message }, { status: 409 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
