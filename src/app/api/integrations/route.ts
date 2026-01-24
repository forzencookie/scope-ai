import { NextResponse } from 'next/server'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

// Default integration states for new users
const DEFAULT_INTEGRATIONS: Record<string, boolean> = {
    // Email Providers
    'gmail': false,
    'yahoo': false,
    'outlook': false,
    // Digital Post
    'kivra': false,
    // Other integrations
    'bankgirot': true,
    'swish': true,
    'google-calendar': false,
    'skatteverket': false,
}

interface IntegrationRow {
    integration_id: string
    connected: boolean
}

export async function GET() {
    try {
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const supabase = userDb.client

        // Fetch user's integrations
        const { data, error } = await supabase
            .from('integrations' as never)
            .select('integration_id, connected')

        if (error) {
            console.error('Failed to fetch integrations:', error)
            return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
        }

        // Merge with defaults (user settings override defaults)
        const integrations = { ...DEFAULT_INTEGRATIONS }
        const rows = (data || []) as unknown as IntegrationRow[]
        for (const row of rows) {
            integrations[row.integration_id] = row.connected
        }

        return NextResponse.json({ integrations })
    } catch (error) {
        console.error('Integrations GET error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const supabase = userDb.client
        const userId = userDb.userId

        const body = await request.json()
        const { id, connected } = body

        if (typeof id !== 'string' || typeof connected !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Upsert the integration state
        const { error } = await supabase
            .from('integrations' as never)
            .upsert({
                user_id: userId,
                integration_id: id,
                connected,
                connected_at: connected ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            } as never, {
                onConflict: 'user_id,integration_id'
            })

        if (error) {
            console.error('Failed to update integration:', error)
            return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
        }

        // Fetch all integrations to return current state
        const { data: allData } = await supabase
            .from('integrations' as never)
            .select('integration_id, connected')

        const integrations = { ...DEFAULT_INTEGRATIONS }
        const rows = (allData || []) as unknown as IntegrationRow[]
        for (const row of rows) {
            integrations[row.integration_id] = row.connected
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
