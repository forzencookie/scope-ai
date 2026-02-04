/**
 * Processed Invoices API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { processInvoices, type NakedInvoice } from "@/services/processors/invoice-processor"

export async function GET() {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch invoices from database (RLS-protected)
        const dbInvoices = await userDb.customerInvoices.list({ limit: 100 });

        // Transform to NakedInvoice format for processor
        const nakedInvoices: NakedInvoice[] = dbInvoices.map(inv => ({
            id: inv.id,
            customerName: inv.customer_name || 'Unknown',
            invoiceNumber: inv.invoice_number || '',
            amount: inv.total_amount || 0,
            issueDate: inv.invoice_date || inv.created_at || '',
            dueDate: inv.due_date || '',
        }));

        const processedInvoices = processInvoices(nakedInvoices);

        return NextResponse.json({
            invoices: processedInvoices,
            count: processedInvoices.length,
            type: "processed",
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}
