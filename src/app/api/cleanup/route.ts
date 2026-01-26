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
import { createUserScopedDb } from '@/lib/user-scoped-db'

export async function DELETE(request: NextRequest) {
    // CRITICAL: Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
        return ApiResponse.unauthorized('Authentication required')
    }

    // Use user-scoped DB - this ensures RLS policies are respected
    // and users can ONLY delete their own data
    const db = createUserScopedDb(auth.userId)

    try {
        // Delete user's own data only (RLS enforced)
        await db.receipts.delete()
        await db.transactions.delete()
        await db.verifications.delete()

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
