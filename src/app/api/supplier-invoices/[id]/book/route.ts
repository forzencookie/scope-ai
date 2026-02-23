/**
 * Supplier Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with VAT handling and source tracking.
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { pendingBookingService } from '@/services/pending-booking-service'
import { createPurchaseEntry } from '@/lib/bookkeeping'
import type { BookingData } from '@/components/bokforing/dialogs/bokforing'
import type { SwedishVatRate } from '@/lib/bookkeeping'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as BookingData
        const { id } = await params

        // Fetch the invoice to get details
        const invoice = await userDb.supplierInvoices.getById(id);
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
        return NextResponse.json(
            { success: false, error: 'Failed to book invoice' },
            { status: 500 }
        )
    }
}
