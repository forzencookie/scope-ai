/**
 * VAT Reports API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, ApiResponse } from "@/lib/database/auth-server";

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    const { data: reports, error } = await supabase
        .from('tax_reports')
        .select('*')
        .eq('type', 'vat')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
        reports: reports || [],
        userId,
        companyId,
    });
})

export const POST = withAuth(async (req, { supabase, companyId }) => {
    const report = await req.json();

    if (!report.period_id) {
        return ApiResponse.badRequest("Missing period_id");
    }

    const { data: savedReport, error } = await supabase
        .from('tax_reports')
        .upsert({
            ...report,
            company_id: companyId,
        })
        .select()
        .single();

    if (error) throw error;

    // If status is 'submitted', update the financial period status too
    if (report.status === 'submitted') {
        await supabase
            .from('financial_periods')
            .update({ status: 'submitted' })
            .eq('id', report.period_id);
    }

    return NextResponse.json({ report: savedReport });
})
