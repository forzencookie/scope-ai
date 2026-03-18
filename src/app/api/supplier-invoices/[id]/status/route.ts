/**
 * Supplier Invoice Status Update API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;
        const { id } = await params;
        const body = await req.json();
        const status = body.status;

        // Update via RLS-protected client
        const { data: updated, error } = await supabase
            .from('supplier_invoices')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) console.error('[SupplierInvoices] status update error:', error);

        if (updated) {
            return NextResponse.json({ success: true, status });
        }

        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    } catch (error) {
        console.error("Status update error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}

export { POST as PUT };
