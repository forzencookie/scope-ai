/**
 * Supplier Invoice Booking API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUserScopedDb } from "@/lib/user-scoped-db"
import type { BookingData } from '@/components/bokforing/dialogs/bokforing'

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

        // Fetch the invoice to get the amount
        const invoice = await userDb.supplierInvoices.getById(id);
        const amount = invoice ? Number(invoice.total_amount) || 0 : (body.amount || 0);

        // Create verification
        const verification = await userDb.verifications.create({
            date: new Date().toISOString().split('T')[0],
            description: body.description || `Lev.faktura bokföring`,
            rows: [
                {
                    account: body.debitAccount,
                    description: 'Kostnad',
                    debit: amount,
                    credit: 0
                },
                {
                    account: body.creditAccount || '2440',
                    description: 'Leverantörsskuld',
                    debit: 0,
                    credit: amount
                }
            ]
        });

        // Update invoice status to booked
        if (invoice) {
            await userDb.supplierInvoices.update(id, { status: 'bokförd' });
        }

        return NextResponse.json({ success: true, verification })

    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to book invoice' },
            { status: 500 }
        )
    }
}
