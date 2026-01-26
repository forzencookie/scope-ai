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
        await client.from('verifications').delete().eq('user_id', db.userId)

        console.log(`[Cleanup] User ${auth.userId} reset their data`)

        return NextResponse.json({ 
            success: true, 
            message: 'Your data has been reset successfully' 
        });
    } catch (error) {
        console.error("Reset Data Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to reset data' 
        }, { status: 500 });
    }
}
