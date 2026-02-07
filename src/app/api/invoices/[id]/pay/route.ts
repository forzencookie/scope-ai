/**
 * Invoice Payment API
 *
 * Records customer payment on a booked invoice.
 * Uses the bookkeeping engine to create proper payment journal entries.
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { verificationService } from '@/services/verification-service';
import { createPaymentReceivedEntry } from '@/lib/bookkeeping';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const invoice = await userDb.customerInvoices.getById(id);

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
        }

        // Update Invoice Status
        await userDb.customerInvoices.update(id, { status: 'betald' });

        const total = Number(invoice.total_amount) || 0;

        // Use the bookkeeping engine for payment received entry
        const journalEntry = createPaymentReceivedEntry({
            date: new Date().toISOString().split('T')[0],
            description: `Betalning faktura ${invoice.invoice_number || id} - ${invoice.customer_name}`,
            amount: total,
            invoiceReference: invoice.invoice_number || undefined,
            series: 'A',
        });

        // Create verification with source tracking and relational lines
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
            sourceType: 'invoice',
            sourceId: id,
        });

        // Create Bank Transaction record
        const transaction = await userDb.transactions.create({
            id: `TX-PAY-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Inbetalning ${invoice.invoice_number || id}`,
            name: `Inbetalning ${invoice.invoice_number || id}`,
            amount: String(total),
            amount_value: total,
            status: 'Bokförd'
        });

        return NextResponse.json({ success: true, verification, transaction });

    } catch (error: unknown) {
        console.error("Payment error:", error);
        const message = error instanceof Error ? error.message : 'Failed to pay invoice';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
