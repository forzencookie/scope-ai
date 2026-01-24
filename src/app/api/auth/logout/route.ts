import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'

/**
 * POST /api/auth/logout
 * Securely logs out the user by clearing the server-side session
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        // Sign out from Supabase - this invalidates the session
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('Logout error:', error)
            return NextResponse.json(
                { error: 'Failed to logout' },
                { status: 500 }
            )
        }

        // Create response that redirects to login
        const response = NextResponse.json({ success: true })

        // Clear any auth-related cookies explicitly
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')

        return response
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        )
    }
}
