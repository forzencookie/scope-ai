/**
 * Invoice Payment API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

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

        const invoice = await userDb.supplierInvoices.getById(id);

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
        }

        // Update Invoice Status
        await userDb.supplierInvoices.update(id, { status: 'betald' });

        const total = Number(invoice.total_amount) || 0;
        const r = (n: number) => Math.round(n * 100) / 100;

        // Create Verification
        const verification = await userDb.verifications.create({
            date: new Date().toISOString().split('T')[0],
            description: `Betalning faktura ${id} - ${invoice.supplier_name}`,
            rows: [
                { account: '1930', description: 'Företagskonto', debit: r(total), credit: 0 },
                { account: '1510', description: 'Kundfordringar', debit: 0, credit: r(total) }
            ]
        });

        // Create Bank Transaction
        const transaction = await userDb.transactions.create({
            id: `TX-PAY-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Inbetalning ${id}`,
            name: `Inbetalning ${id}`,
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
