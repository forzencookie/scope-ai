/**
 * Customer Invoices API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, ApiResponse } from "@/lib/database/auth-server";
import { invoiceService } from "@/services/invoicing/invoice-service";

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
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
})

export const POST = withAuth(async (req, { supabase, userId, companyId }) => {
    const body = await req.json();

    if (!body.customer) {
        return ApiResponse.badRequest("Kundnamn krävs");
    }

    const invoice = await invoiceService.createInvoice(body, userId, companyId ?? '', supabase);

    return NextResponse.json({ invoice });
})
