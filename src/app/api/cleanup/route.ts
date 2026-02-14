/**
 * DANGER: Data cleanup endpoint
 * 
 * This endpoint deletes ALL user data from the database.
 * SECURITY: Requires authentication + only allows users to delete their OWN data
 * 
 * Previously this was completely unprotected - anyone could wipe all data!
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { logAuditEntry } from '@/lib/audit'

export async function DELETE(request: NextRequest) {
    // CRITICAL: Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
        return ApiResponse.unauthorized('Authentication required')
    }

    // Use user-scoped DB - this ensures RLS policies are respected
    // and users can ONLY delete their own data
    const db = await createUserScopedDb()
    if (!db) {
        return ApiResponse.unauthorized('Could not establish database connection')
    }

    try {
        // Delete user's own data only (RLS enforced via the client)
        // We use the client directly since user-scoped-db doesn't have delete methods
        const client = db.client

        await client.from('receipts').delete().eq('user_id', db.userId)
        await client.from('transactions').delete().eq('user_id', db.userId)

        // BFL 7 kap: Check for locked verifications before deleting
        const { count: lockedCount } = await client
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', db.userId)
            .eq('is_locked', true)

        // Only delete unlocked verifications (locked = closed period, 7-year retention)
        await client
            .from('verifications')
            .delete()
            .eq('user_id', db.userId)
            .eq('is_locked', false)

        const preserved = lockedCount || 0

        console.log(`[Cleanup] User ${auth.userId} reset their data (preserved ${preserved} locked verifications)`)

        // Audit trail: log the cleanup operation
        logAuditEntry({
            action: 'deleted',
            entityType: 'verifications',
            entityName: 'Nollställning av data',
            metadata: { preserved, userId: auth.userId },
        })

        return NextResponse.json({
            success: true,
            message: preserved > 0
                ? `Data har nollställts. ${preserved} verifikationer i stängda perioder bevarades (BFL 7 kap).`
                : 'Your data has been reset successfully',
            preserved,
        });
    } catch (error) {
        console.error("Reset Data Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to reset data' 
        }, { status: 500 });
    }
}
