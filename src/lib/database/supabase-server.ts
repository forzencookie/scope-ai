import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for Server Components and Route Handlers
 * Uses cookies for session management with proper RLS enforcement
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
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
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    )
}

/**
 * Create a Supabase client for Middleware
 * Handles cookie operations through request/response
 */
export function createMiddlewareSupabaseClient(
    request: NextRequest,
    response: NextResponse
) {
    return createServerClient<Database>(
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

/**
 * Get the current authenticated user from a server context
 * Returns null if not authenticated
 */
export async function getServerUser() {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

/**
 * Get the current session from a server context
 * Returns null if not authenticated
 */
export async function getServerSession() {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return null
    }

    return session
}

/**
 * Require authentication in a server context
 * Throws if not authenticated - use in API routes
 */
export async function requireAuth() {
    const user = await getServerUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}
