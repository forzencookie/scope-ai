/**
 * Verifications API
 *
 * Returns verifications with their journal lines for the ledger view.
 * POST creates new verifications with proper source tracking.
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { verificationService } from '@/services/verification-service';

export async function GET() {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const verifications = await userDb.verifications.list({ limit: 200 });

        // Enrich each verification with its relational journal lines
        const enriched = await Promise.all(
            verifications.map(async (v) => {
                const lines = await userDb.verificationLines.listByVerification(v.id);
                return {
                    ...v,
                    lines,
                };
            })
        );

        return NextResponse.json({
            verifications: enriched,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch verifications:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

            return NextResponse.json({ success: true, verification });
        }

        // Bare verification (no lines) — legacy fallback
        const saved = await userDb.verifications.create({
            date: body.date || new Date().toISOString().split('T')[0],
            description: body.description,
        });

        if (!saved) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        return NextResponse.json({ success: true, verification: saved });
    } catch (error) {
        console.error("Failed to create verification:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
