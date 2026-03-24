/**
 * Integrations API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ApiResponse } from "@/lib/database/auth-server"

// Default integration states for new users
const DEFAULT_INTEGRATIONS: Record<string, boolean> = {
    'bankgirot': true,
    'swish': true,
    'google-calendar': false,
    'skatteverket': false,
}

export const GET = withAuth(async (_request, { supabase }) => {
    // Fetch user's integrations
    const { data, error } = await supabase
        .from('integrations')
        .select('integration_id, connected')

    if (error) {
        console.error('Failed to fetch integrations:', error)
        return ApiResponse.serverError('Failed to fetch integrations')
    }

    // Merge with defaults (user settings override defaults)
    const integrations = { ...DEFAULT_INTEGRATIONS }
    const rows = data || []
    for (const row of rows) {
        if (row.integration_id) {
            integrations[row.integration_id] = row.connected ?? false
        }
    }

    return NextResponse.json({ integrations })
})

export const POST = withAuth(async (request, { supabase, userId }) => {
    const body = await request.json()
    const { id, connected } = body

    if (typeof id !== 'string' || typeof connected !== 'boolean') {
        return ApiResponse.badRequest('Invalid request')
    }

    // Upsert the integration state
    const { error } = await supabase
        .from('integrations')
        .upsert({
            user_id: userId,
            integration_id: id,
            connected,
            connected_at: connected ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,integration_id'
        })

    if (error) {
        console.error('Failed to update integration:', error)
        return ApiResponse.serverError('Failed to update integration')
    }

    // Fetch all integrations to return current state
    const { data: allData } = await supabase
        .from('integrations')
        .select('integration_id, connected')

    const integrations = { ...DEFAULT_INTEGRATIONS }
    const rows = allData || []
    for (const row of rows) {
        if (row.integration_id) {
            integrations[row.integration_id] = row.connected ?? false
        }
    }

    return NextResponse.json({
        id,
        connected,
        integrations
    })
})
