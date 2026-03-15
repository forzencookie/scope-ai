/**
 * Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with source tracking for report aggregation.
 *
 * Supports per-line VAT rates from invoice items — groups line items by
 * VAT rate and creates correct revenue + output VAT entries for each group.
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from '@/lib/database/auth';
import { pendingBookingService } from '@/services/pending-booking-service';
import { createSalesEntry, createMultiVatSalesEntry } from '@/lib/bookkeeping';
import type { SwedishVatRate } from '@/lib/bookkeeping';

interface InvoiceLineItem {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    vatRate?: number;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;
        const { id } = await params;

        // Find the invoice
        const { data: invoice } = await supabase
            .from('customerinvoices')
            .select('*')
            .eq('id', id)
            .single();

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status === 'skickad' || invoice.status === 'betald') {
            return NextResponse.json({ error: "Invoice already booked" }, { status: 400 });
        }

        // Update Invoice Status
        await supabase
            .from('customerinvoices')
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
        const invoiceNumber = invoice.invoice_number || undefined;
        const description = invoiceNumber ? `${customerName} (Faktura ${invoiceNumber})` : customerName;

        // Parse line items to determine entry creation method
        // Items may be stored as { lines: [...], bankgiro, ... } or as a plain array
        const rawItems = invoice.items as InvoiceLineItem[] | { lines?: InvoiceLineItem[] } | null;
        const items: InvoiceLineItem[] | null = rawItems
            ? Array.isArray(rawItems) ? rawItems
            : Array.isArray((rawItems as { lines?: InvoiceLineItem[] }).lines) ? (rawItems as { lines: InvoiceLineItem[] }).lines
            : null
            : null;

        let journalEntry;

        if (items && items.length > 0) {
            // Multi-VAT-rate: use line-item-aware entry creator
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
            // Single VAT rate: use simple sales entry
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

        // Create pending booking
        const pending = await pendingBookingService.createPendingBooking({
            sourceType: 'customer_invoice',
            sourceId: id,
            description,
            entries: journalEntry.rows.map(row => ({
                account: row.account,
                debit: row.debit,
                credit: row.credit,
                description: row.description,
            })),
            series: 'A',
            date,
            metadata: { customerName, invoiceNumber, total },
        });

        return NextResponse.json({ success: true, pendingBookingId: pending.id });

    } catch (error) {
        console.error("Booking error:", error);
        const message = error instanceof Error ? error.message : 'Failed to book invoice';

        if (message.includes('balanserar inte')) {
            return NextResponse.json({ error: message }, { status: 422 });
        }
        if (message.includes('redan bokförd') || message.includes('already')) {
            return NextResponse.json({ error: message }, { status: 409 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
