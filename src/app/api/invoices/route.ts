/**
 * Customer Invoices API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from '@/lib/database/auth';
import { generateOCR } from '@/lib/ocr';

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { data: invoices, error } = await supabase
            .from('customerinvoices')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) console.error('[Invoices] list error:', error);

        return NextResponse.json({
            invoices: invoices || [],
            userId,
            companyId,
        });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const body = await req.json();

        if (!body.customer) {
            return NextResponse.json({ error: "Kundnamn krävs" }, { status: 400 });
        }

        // Get next invoice number
        const year = new Date().getFullYear();
        const { data: lastInvoices } = await supabase
            .from('customerinvoices')
            .select('invoice_number')
            .like('invoice_number', `FAK-${year}-%`)
            .order('invoice_number', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (lastInvoices && lastInvoices.length > 0) {
            const lastNum = parseInt(lastInvoices[0].invoice_number.split('-')[2]) || 0;
            nextNum = lastNum + 1;
        }
        const invoiceNumber = `FAK-${year}-${String(nextNum).padStart(4, '0')}`;

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

        // Generate OCR reference from invoice number (Luhn check digit)
        const ocrReference = generateOCR(invoiceNumber);

        // Prepare invoice data for database
        const invoiceData = {
            invoice_number: invoiceNumber,
            ocr_reference: ocrReference,
            customer_name: body.customer,
            customer_email: body.email || null,
            customer_address: body.address || null,
            customer_org_number: body.orgNumber || null,
            invoice_date: body.issueDate || new Date().toISOString().split('T')[0],
            due_date: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: finalSubtotal,
            vat_amount: finalVatAmount,
            total_amount: finalTotal,
            // Store line items + payment info + notes in the items JSON field
            items: {
                lines: body.items || [],
                bankgiro: body.bankgiro || null,
                plusgiro: body.plusgiro || null,
                notes: body.notes || null,
            },
            status: body.status || 'Utkast',
            currency: body.currency || 'SEK',
            // payment_reference stores the customer reference (Er referens)
            payment_reference: body.reference || null,
            user_id: userId,
            company_id: companyId || '',
        };

        const { data: created, error } = await supabase
            .from('customerinvoices')
            .insert(invoiceData)
            .select()
            .single();

        if (error) console.error('[Invoices] create error:', error);

        if (!created) {
            return NextResponse.json({ error: "Kunde inte spara faktura" }, { status: 500 });
        }

        // Return in format expected by frontend
        const storedItems = created.items as { lines?: unknown[]; bankgiro?: string; plusgiro?: string; notes?: string } | null
        const responseInvoice = {
            id: created.invoice_number,
            ocrReference: ocrReference,
            customer: created.customer_name,
            email: created.customer_email,
            address: created.customer_address,
            orgNumber: created.customer_org_number,
            amount: created.total_amount,
            vatAmount: created.vat_amount,
            subtotal: created.subtotal,
            issueDate: created.invoice_date,
            dueDate: created.due_date,
            status: created.status,
            currency: created.currency,
            reference: created.payment_reference,
            bankgiro: storedItems?.bankgiro || null,
            plusgiro: storedItems?.plusgiro || null,
            notes: storedItems?.notes || null,
            items: storedItems?.lines || [],
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
