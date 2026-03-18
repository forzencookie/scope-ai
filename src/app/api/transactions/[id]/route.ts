/**
 * Transaction Update API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/database/auth-server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;

        const body = await request.json()

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
        }

        // Update transaction via RLS-protected client
        const { data: updated, error } = await supabase
            .from('transactions')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) console.error(`[Transactions] update error for ${id}:`, error);

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Transaction not found or update failed' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updated
        })
    } catch (error) {
        console.error(`Failed to update transaction ${id}:`, error)
        return NextResponse.json(
            { success: false, error: 'Failed to update transaction' },
            { status: 500 }
        )
    }
}
