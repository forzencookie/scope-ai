/**
 * Receipt CRUD API
 *
 * DELETE: Remove a receipt
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const userDb = await createUserScopedDb()

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await userDb.client
            .from('receipts')
            .delete()
            .eq('id', id)

        if (error) {
            console.error(`Failed to delete receipt ${id}:`, error)
            return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(`Failed to delete receipt ${id}:`, error)
        return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 })
    }
}
