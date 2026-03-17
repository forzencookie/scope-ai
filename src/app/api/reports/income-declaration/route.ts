/**
 * Income Declaration (INK2) Reports API
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
    } catch (error) {
        console.error("Failed to fetch income declaration reports:", error);
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
                type: 'income_declaration',
                tax_year: report.taxYear,
                data: report.data,
                status: report.status || 'draft',
                company_id: companyId,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, report: savedReport });
    } catch (error) {
        console.error("Failed to save income declaration:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
