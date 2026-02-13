/**
 * Invoice Booking API
 *
 * Uses the bookkeeping engine to create proper double-entry journal entries
 * with source tracking for report aggregation.
 *
 * Supports per-line VAT rates from invoice items — groups line items by
 * VAT rate and creates correct revenue + output VAT entries for each group.
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { verificationService } from '@/services/verification-service';
import { getVatAccount } from '@/lib/bookkeeping/vat';
import type { SwedishVatRate } from '@/lib/bookkeeping/types';

interface InvoiceLineItem {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    vatRate?: number;
}

function isValidVatRate(rate: number): rate is SwedishVatRate {
    return rate === 0 || rate === 6 || rate === 12 || rate === 25;
}

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

        const total = Number(invoice.total_amount) || 0;
        const date = new Date().toISOString().split('T')[0];
        const customerName = invoice.customer_name || 'Kund';
        const invoiceNumber = invoice.invoice_number || undefined;
        const description = invoiceNumber ? `${customerName} (Faktura ${invoiceNumber})` : customerName;

        const entries: { account: string; debit: number; credit: number; description: string }[] = [];

        // Debit: Customer receivable for full gross amount
        entries.push({
            account: '1510',
            debit: total,
            credit: 0,
            description: invoiceNumber ? `Kundfaktura ${invoiceNumber}` : 'Kundfordran',
        });

        // Parse line items to get per-line VAT rates
        const items = invoice.items as InvoiceLineItem[] | null;

        if (items && Array.isArray(items) && items.length > 0) {
            // Group line items by VAT rate
            const vatGroups = new Map<SwedishVatRate, number>();
            for (const item of items) {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const lineNet = Math.round(qty * price * 100) / 100;
                const rawRate = Number(item.vatRate) ?? 25;
                const vatRate: SwedishVatRate = isValidVatRate(rawRate) ? rawRate : 25;

                vatGroups.set(vatRate, (vatGroups.get(vatRate) || 0) + lineNet);
            }

            // Credit: Revenue and output VAT per VAT rate group
            for (const [vatRate, netAmount] of vatGroups) {
                const roundedNet = Math.round(netAmount * 100) / 100;

                entries.push({
                    account: '3001',
                    debit: 0,
                    credit: roundedNet,
                    description: vatRate > 0 ? `Försäljning (exkl moms ${vatRate}%)` : 'Försäljning (momsfri)',
                });

                if (vatRate > 0) {
                    const vatAmount = Math.round(roundedNet * (vatRate / 100) * 100) / 100;
                    const vatAccount = getVatAccount(vatRate, 'output');

                    entries.push({
                        account: vatAccount,
                        debit: 0,
                        credit: vatAmount,
                        description: `Utgående moms ${vatRate}%`,
                    });
                }
            }
        } else {
            // Fallback: use invoice-level vat_rate or derive from total vs vat_amount
            const invoiceVatRate = Number(invoice.vat_rate);
            const vatRate: SwedishVatRate = isValidVatRate(invoiceVatRate) ? invoiceVatRate : 25;
            const vatMultiplier = vatRate / 100;
            const netAmount = Math.round((total / (1 + vatMultiplier)) * 100) / 100;
            const vatAmount = Math.round((total - netAmount) * 100) / 100;

            entries.push({
                account: '3001',
                debit: 0,
                credit: netAmount,
                description: `Försäljning (exkl moms ${vatRate}%)`,
            });

            if (vatRate > 0) {
                entries.push({
                    account: getVatAccount(vatRate, 'output'),
                    debit: 0,
                    credit: vatAmount,
                    description: `Utgående moms ${vatRate}%`,
                });
            }
        }

        // Create verification with source tracking and relational lines
        const verification = await verificationService.createVerification({
            series: 'A',
            date,
            description,
            entries,
            sourceType: 'invoice',
            sourceId: id,
        });

        return NextResponse.json({ success: true, verification });

    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json({ error: "Failed to book invoice" }, { status: 500 });
    }
}
