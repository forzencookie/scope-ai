/**
 * Income Declaration (INK2) Reports API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/database/auth-server";

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    const { data: reports, error } = await supabase
        .from('tax_reports')
        .select('*')
        .eq('type', 'income_declaration')
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

    const { data: savedReport, error } = await supabase
        .from('tax_reports')
        .insert({
            type: 'income_declaration',
            tax_year: report.taxYear,
            data: report.data,
            status: report.status || 'draft',
            company_id: companyId,
        })
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ report: savedReport });
})
