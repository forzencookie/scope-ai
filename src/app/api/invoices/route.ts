/**
 * Customer Invoices API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";
import { invoiceService } from "@/services/invoicing/invoice-service";

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { data: invoices, error } = await supabase
            .from('customer_invoices')
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

        const invoice = await invoiceService.createInvoice(body, userId, companyId ?? '', supabase);

        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
