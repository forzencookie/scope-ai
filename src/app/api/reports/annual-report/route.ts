/**
 * Annual Report (Årsredovisning) API
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { data: reports, error } = await supabase
            .from('tax_reports')
            .select('*')
            .eq('type', 'annual_report')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            reports: reports || [],
            userId,
            companyId,
        });
    } catch (error) {
        console.error("Failed to fetch annual reports:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, companyId } = ctx;
        const report = await req.json();

        const { data: savedReport, error } = await supabase
            .from('tax_reports')
            .insert({
                type: 'annual_report',
                fiscal_year: report.fiscalYear,
                data: report.data,
                status: report.status || 'draft',
                company_id: companyId,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, report: savedReport });
    } catch (error) {
        console.error("Failed to save annual report:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
