/**
 * Annual Report (Årsredovisning) API
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function GET() {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reports, error } = await userDb.client
            .from('taxreports' as any)
            .select('*')
            .eq('type', 'annual_report')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            reports: reports || [],
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch annual reports:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const report = await req.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedReport, error } = await userDb.client
            .from('taxreports' as any)
            .insert({
                type: 'annual_report',
                fiscal_year: report.fiscalYear,
                data: report.data,
                status: report.status || 'draft',
                company_id: userDb.companyId,
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
