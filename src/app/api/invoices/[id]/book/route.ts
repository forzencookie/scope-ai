/**
 * Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with source tracking for report aggregation.
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { verificationService } from '@/services/verification-service';
import { createSalesEntry } from '@/lib/bookkeeping';

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

        // Find the invoice
        const invoice = await userDb.customerInvoices.getById(id);

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'skickad' || invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already booked" }, { status: 400 });
        }

        // Update Invoice Status
        await userDb.customerInvoices.update(id, { status: 'skickad' });

        // Use the bookkeeping engine to generate proper journal entries
        const total = Number(invoice.total_amount) || 0;
        const journalEntry = createSalesEntry({
            date: new Date().toISOString().split('T')[0],
            description: `${invoice.customer_name || 'Kund'}`,
            grossAmount: total,
            revenueAccount: '3001',
            vatRate: 25,
            invoiceNumber: invoice.invoice_number || undefined,
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

        return NextResponse.json({ success: true, verification });

    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to book invoice" }, { status: 500 });
    }
}
