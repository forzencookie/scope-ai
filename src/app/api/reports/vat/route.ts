/**
 * VAT Reports API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from '@/lib/database/auth';

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reports, error } = await supabase
            .from('tax_reports' as any)
            .select('*')
            .eq('type', 'vat')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            reports: reports || [],
            userId,
            companyId,
        });
    } catch (error) {
        console.error("Failed to fetch VAT reports:", error);
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

        if (!report.period_id) {
            return NextResponse.json({ error: "Missing period_id" }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedReport, error } = await supabase
            .from('tax_reports' as any)
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

        return NextResponse.json({ success: true, report: savedReport });
    } catch (error) {
        console.error("Failed to save VAT report:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
