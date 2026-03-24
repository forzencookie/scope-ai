/**
 * Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with source tracking for report aggregation.
 *
 * Supports per-line VAT rates from invoice items — groups line items by
 * VAT rate and creates correct revenue + output VAT entries for each group.
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server";
import { verificationService } from '@/services/accounting/verification-service';
import { nullToUndefined } from '@/lib/utils';
import { createSalesEntry, createMultiVatSalesEntry } from '@/lib/bookkeeping';
import type { SwedishVatRate } from '@/lib/bookkeeping';

interface InvoiceLineItem {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    vatRate?: number;
}

export const POST = withAuthParams(async (req: NextRequest, { supabase }, { id }) => {
    // Find the invoice
    const { data: invoice } = await supabase
        .from('customer_invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (!invoice) {
        return ApiResponse.notFound('Invoice not found');
    }

    if (invoice.status === 'skickad' || invoice.status === 'betald') {
        return ApiResponse.badRequest('Invoice already booked');
    }

    // Update Invoice Status
    await supabase
        .from('customer_invoices')
        .update({ status: 'skickad' })
        .eq('id', id);

    // Read optional accountingMethod from request body
    let accountingMethod: 'cash' | 'invoice' | undefined;
    try {
        const body = await req.json();
        if (body.accountingMethod === 'cash' || body.accountingMethod === 'invoice') {
            accountingMethod = body.accountingMethod;
        }
    } catch {
        // No body or invalid JSON — use default (invoice method)
    }

    const total = Number(invoice.total_amount) || 0;
    const date = new Date().toISOString().split('T')[0];
    const customerName = invoice.customer_name || 'Kund';
    const invoiceNumber = nullToUndefined(invoice.invoice_number);
    const description = invoiceNumber ? `${customerName} (Faktura ${invoiceNumber})` : customerName;

    // Parse line items to determine entry creation method
    const rawItems = invoice.items as InvoiceLineItem[] | { lines?: InvoiceLineItem[] } | null;
    const items: InvoiceLineItem[] | null = rawItems
        ? Array.isArray(rawItems) ? rawItems
        : Array.isArray((rawItems as { lines?: InvoiceLineItem[] }).lines) ? (rawItems as { lines: InvoiceLineItem[] }).lines
        : null
        : null;

    let journalEntry;

    if (items && items.length > 0) {
        journalEntry = createMultiVatSalesEntry({
            date,
            description: customerName,
            grossAmount: total,
            lineItems: items.map(item => ({
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                vatRate: Number(item.vatRate) ?? 25,
                description: item.description,
            })),
            invoiceNumber,
            accountingMethod,
        });
    } else {
        const invoiceVatRate = Number(invoice.vat_rate);
        const isValid = (r: number): r is SwedishVatRate => r === 0 || r === 6 || r === 12 || r === 25;
        const vatRate: SwedishVatRate = isValid(invoiceVatRate) ? invoiceVatRate : 25;

        journalEntry = createSalesEntry({
            date,
            description: customerName,
            grossAmount: total,
            vatRate,
            invoiceNumber,
            accountingMethod,
        });
    }

    // Create verification directly
    const verification = await verificationService.createVerification({
        series: 'A',
        date,
        description,
        entries: journalEntry.rows.map(row => ({
            account: row.account,
            debit: row.debit,
            credit: row.credit,
            description: row.description,
        })),
        sourceType: 'customer_invoice',
        sourceId: id,
    }, supabase);

    return NextResponse.json({
        verificationId: verification.id,
        verificationNumber: `${verification.series}${verification.number}`,
    });
})
