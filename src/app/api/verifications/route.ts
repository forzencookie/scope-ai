/**
 * Verifications API
 *
 * Returns verifications with their journal lines for the ledger view.
 * POST creates new verifications with proper source tracking.
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import type { Database } from '@/types/database';
import { withAuth } from "@/lib/database/auth-server";
import { verificationService } from '@/services/accounting/verification-service';

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    const { data: verifications } = await supabase
        .from('verifications')
        .select('*')
        .order('date', { ascending: false })
        .limit(200);

    const vList = verifications || [];

    // Batch-fetch all verification lines in a single query (fixes N+1)
    const verificationIds = vList.map(v => v.id);
    let allLines: Database['public']['Tables']['verification_lines']['Row'][] = [];
    if (verificationIds.length > 0) {
        const { data } = await supabase
            .from('verification_lines')
            .select('*')
            .in('verification_id', verificationIds)
            .order('created_at', { ascending: true })
        allLines = data || [];
    }

    // Group lines by verification_id
    const linesByVerification = new Map<string, typeof allLines>();
    for (const line of allLines) {
        const existing = linesByVerification.get(line.verification_id) || [];
        existing.push(line);
        linesByVerification.set(line.verification_id, existing);
    }

    const enriched = vList.map(v => ({
        ...v,
        lines: linesByVerification.get(v.id) || [],
    }));

    return NextResponse.json({
        verifications: enriched,
        userId,
        companyId,
    });
})

export const POST = withAuth(async (req, { supabase, userId, companyId }) => {
    const body = await req.json();

    // If entries/rows are provided, use the full verification service
    // to persist both the JSONB rows and relational verification_lines
    if (body.entries || body.rows) {
        const entries = body.entries || body.rows;
        const verification = await verificationService.createVerification({
            series: body.series || 'A',
            date: body.date || new Date().toISOString().split('T')[0],
            description: body.description,
            entries: entries.map((e: { account: string; debit: number; credit: number; description?: string }) => ({
                account: e.account,
                debit: e.debit || 0,
                credit: e.credit || 0,
                description: e.description,
            })),
            sourceType: body.sourceType || 'manual',
            sourceId: body.sourceId,
        });

        return NextResponse.json({ verification });
    }

    // Bare verification (no lines) — legacy fallback
    const { data: saved } = await supabase
        .from('verifications')
        .insert({
            date: body.date || new Date().toISOString().split('T')[0],
            description: body.description,
            user_id: userId,
            company_id: companyId,
        })
        .select()
        .single();

    if (!saved) {
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({ verification: saved });
})
