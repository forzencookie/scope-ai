/**
 * Transaction Update API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json()

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
        }

        // Update transaction via RLS-protected client
        const updated = await userDb.transactions.update(id, body)

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
