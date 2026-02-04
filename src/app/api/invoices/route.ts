/**
 * Customer Invoices API
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function GET() {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const invoices = await userDb.customerInvoices.list({ limit: 100 });

        return NextResponse.json({
            invoices,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (!body.customer) {
            return NextResponse.json({ error: "Kundnamn krävs" }, { status: 400 });
        }

        // Get next invoice number
        const invoiceNumber = await userDb.customerInvoices.getNextInvoiceNumber();

        // Calculate totals from line items if provided
        let subtotal = 0;
        let vatAmount = 0;
        if (body.items && Array.isArray(body.items)) {
            subtotal = body.items.reduce((sum: number, item: { quantity?: number; unitPrice?: number }) => {
                return sum + ((item.quantity || 0) * (item.unitPrice || 0));
            }, 0);
            vatAmount = body.items.reduce((sum: number, item: { quantity?: number; unitPrice?: number; vatRate?: number }) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return sum + (lineTotal * (item.vatRate || 0) / 100);
            }, 0);
        }

        // Use provided amounts or calculated ones
        const finalSubtotal = body.subtotal ?? subtotal;
        const finalVatAmount = body.vatAmount ?? vatAmount;
        const finalTotal = body.amount ?? (finalSubtotal + finalVatAmount);

        // Prepare invoice data for database
        const invoiceData = {
            invoice_number: invoiceNumber,
            customer_name: body.customer,
            customer_email: body.email || null,
            customer_address: body.address || null,
            customer_org_number: body.orgNumber || null,
            invoice_date: body.issueDate || new Date().toISOString().split('T')[0],
            due_date: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: finalSubtotal,
            vat_amount: finalVatAmount,
            total_amount: finalTotal,
            items: body.items || null,
            status: body.status || 'Utkast',
            currency: body.currency || 'SEK',
            user_id: userDb.userId,
            company_id: userDb.companyId || '',
        };

        const created = await userDb.customerInvoices.create(invoiceData);

        if (!created) {
            return NextResponse.json({ error: "Kunde inte spara faktura" }, { status: 500 });
        }

        // Return in format expected by frontend
        const responseInvoice = {
            id: created.invoice_number,
            customer: created.customer_name,
            email: created.customer_email,
            amount: created.total_amount,
            vatAmount: created.vat_amount,
            issueDate: created.invoice_date,
            dueDate: created.due_date,
            status: created.status,
            items: created.items,
            dbId: created.id,
        };

        return NextResponse.json({
            success: true,
            invoice: responseInvoice
        });
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
