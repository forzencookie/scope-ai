import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/database/auth'

// Default integration states for new users
const DEFAULT_INTEGRATIONS: Record<string, boolean> = {
    'bankgirot': true,
    'swish': true,
    'google-calendar': false,
    'skatteverket': false,
}


export async function GET() {
    try {
        const ctx = await getAuthContext()
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { supabase } = ctx

        // Fetch user's integrations
        const { data, error } = await supabase
            .from('integrations')
            .select('integration_id, connected')

        if (error) {
            console.error('Failed to fetch integrations:', error)
            return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
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
    } catch (error) {
        console.error('Integrations GET error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext()
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { supabase, userId } = ctx

        const body = await request.json()
        const { id, connected } = body

        if (typeof id !== 'string' || typeof connected !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
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
            return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
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
            success: true,
            id,
            connected,
            integrations
        })
    } catch (error) {
        console.error('Integrations POST error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
