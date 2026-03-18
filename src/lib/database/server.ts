/**
 * Server-side Database Client Factory
 * 
 * Handles Supabase client creation for Server Components, Route Handlers, 
 * and Server Actions. Enforces RLS and provides admin access.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _adminClient: SupabaseClient<Database> | null = null

/**
 * Server client — uses cookies for session management with RLS enforcement.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createServerClient() {
    const cookieStore = await cookies()

    return createSSRServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
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
        supabaseUrl,
        supabaseAnonKey,
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
