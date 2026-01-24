/**
 * Invoice Booking API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from "@/lib/user-scoped-db";

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
        const invoice = await userDb.supplierInvoices.getById(id);

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'skickad' || invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already booked" }, { status: 400 });
        }

        // Update Invoice Status
        await userDb.supplierInvoices.update(id, { status: 'skickad' });

        // Create Verification
        const total = Number(invoice.total_amount) || 0;
        const vat = total - (total / 1.25);
        const net = total - vat;
        const r = (n: number) => Math.round(n * 100) / 100;

        const verification = await userDb.verifications.create({
            date: new Date().toISOString().split('T')[0],
            description: `Faktura ${id} - ${invoice.supplier_name}`,
            rows: [
                { account: '1510', description: 'Kundfordringar', debit: r(total), credit: 0 },
                { account: '3001', description: 'Försäljning inom Sverige', debit: 0, credit: r(net) },
                { account: '2611', description: 'Utgående moms 25%', debit: 0, credit: r(vat) }
            ]
        });

        return NextResponse.json({ success: true, verification });

    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to book invoice" }, { status: 500 });
    }
}
