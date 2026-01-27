/**
 * VAT Reports API
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
            .eq('type', 'vat')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            reports: reports || [],
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch VAT reports:", error);
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

        if (!report.period_id) {
            return NextResponse.json({ error: "Missing period_id" }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedReport, error } = await userDb.client
            .from('taxreports' as any)
            .upsert({
                ...report,
                company_id: userDb.companyId,
            })
            .select()
            .single();

        if (error) throw error;

        // If status is 'submitted', update the financial period status too
        if (report.status === 'submitted') {
            await userDb.client
                .from('financialperiods')
                .update({ status: 'submitted' })
                .eq('id', report.period_id);
        }

        return NextResponse.json({ success: true, report: savedReport });
    } catch (error) {
        console.error("Failed to save VAT report:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
