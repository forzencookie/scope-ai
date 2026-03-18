/**
 * Server-side Authentication Layer
 *
 * Auth helpers for Route Handlers, Server Components, and Server Actions.
 * Strictly server-only to avoid boundary leaks.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { User, Session } from '@supabase/supabase-js'
import { createServerClient } from './server'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export interface AuthResult {
    user: User
    userId: string
    email: string
}

export interface AuthContext {
    supabase: SupabaseClient<Database>
    userId: string
    companyId: string | null
}

export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401
    ) {
        super(message)
        this.name = 'AuthError'
    }
}

// =============================================================================
// Server-side auth
// =============================================================================

export async function getServerUser(): Promise<User | null> {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function getServerSession(): Promise<Session | null> {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return null
    }

    return session
}

export async function requireAuth(): Promise<User> {
    const user = await getServerUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}

/**
 * Get authenticated context with supabase client, userId, and companyId.
 * Used in Route Handlers.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: membership } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

    return {
        supabase,
        userId: user.id,
        companyId: membership?.company_id ?? null,
    }
}

/**
 * Quick check if user is authenticated
 */
export async function isAuthenticated(): Promise<{ userId: string } | null> {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return { userId: user.id }
}

// =============================================================================
// API route auth helpers
// =============================================================================

export const ApiResponse = {
    unauthorized: (message = 'Unauthorized') =>
        NextResponse.json({ error: message }, { status: 401 }),

    forbidden: (message = 'Forbidden') =>
        NextResponse.json({ error: message }, { status: 403 }),

    badRequest: (message = 'Bad Request') =>
        NextResponse.json({ error: message }, { status: 400 }),

    notFound: (message = 'Not Found') =>
        NextResponse.json({ error: message }, { status: 404 }),

    serverError: (message = 'Internal Server Error') =>
        NextResponse.json({ error: message }, { status: 500 }),

    success: <T>(data: T, status = 200) =>
        NextResponse.json(data, { status }),
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return null
        }

        return {
            user,
            userId: user.id,
            email: user.email || '',
        }
    } catch (error) {
        console.error('Auth verification failed:', error)
        return null
    }
}

export async function requireApiAuth(request: NextRequest): Promise<AuthResult> {
    const auth = await verifyAuth(request)

    if (!auth) {
        throw new AuthError('Unauthorized', 401)
    }

    return auth
}

export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const supabase = await createServerClient()
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        return profile?.role === 'admin'
    } catch {
        return false
    }
}

export async function requireAdminAuth(request: NextRequest): Promise<AuthResult> {
    const auth = await requireApiAuth(request)

    if (!(await isAdmin(auth.userId))) {
        throw new AuthError('Admin access required', 403)
    }

    return auth
}

export function withAuth<T>(
    handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse<T>>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const auth = await requireApiAuth(request)
            return await handler(request, auth)
        } catch (error) {
            if (error instanceof AuthError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: error.statusCode }
                )
            }

            console.error('API error:', error)
            return ApiResponse.serverError()
        }
    }
}

export function withAdminAuth<T>(
    handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse<T>>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const auth = await requireAdminAuth(request)
            return await handler(request, auth)
        } catch (error) {
            if (error instanceof AuthError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: error.statusCode }
                )
            }

            console.error('API error:', error)
            return ApiResponse.serverError()
        }
    }
}

export async function getAuthenticatedSupabase() {
    return createServerClient()
}
