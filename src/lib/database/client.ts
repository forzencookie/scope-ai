/**
 * Database Client Factory
 *
 * Single source of truth for all Supabase client creation.
 * Replaces: supabase.ts, supabase-server.ts (client parts)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _browserClient: SupabaseClient<Database> | null = null
let _adminClient: SupabaseClient<Database> | null = null

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Browser client — uses @supabase/ssr for cookie-based session handling.
 * Only use in client components.
 */
export function createBrowserClient(): SupabaseClient<Database> {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        )
    }

    if (!_browserClient) {
        _browserClient = createSSRBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    }

    return _browserClient
}

/**
 * Server client — uses cookies for session management with RLS enforcement.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createServerClient() {
    const cookieStore = await cookies()

    return createSSRServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from Server Component — ignore
                    }
                },
            },
        }
    )
}

/**
 * Admin client — bypasses RLS via service role key.
 * Only use in API routes / server-side when RLS must be skipped.
 */
export function createAdminClient(): SupabaseClient<Database> {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY. ' +
            'This is required for admin operations.'
        )
    }

    if (!_adminClient) {
        _adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })
    }

    return _adminClient
}

/**
 * Middleware client — handles cookie operations through request/response.
 * Only use in middleware.ts.
 */
export function createMiddlewareClient(
    request: NextRequest,
    response: NextResponse
) {
    return createSSRServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )
}
