/**
 * Supplier Invoice Status Update API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const status = body.status;

        // Update via RLS-protected client
        const updated = await userDb.supplierInvoices.update(id, { status });

        if (updated) {
            return NextResponse.json({ success: true, status });
        }

        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    } catch (error) {
        console.error("Status update error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
