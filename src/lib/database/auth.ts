/**
 * Authentication Layer
 *
 * Unified auth helpers for client-side, server-side, and API routes.
 * Replaces: supabase-auth.ts, supabase-server.ts (auth parts), api-auth.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from './client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export interface AuthResponse {
    user: User | null
    session: Session | null
    error: SupabaseAuthError | null
}

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

// =============================================================================
// Client-side auth (browser only)
// =============================================================================

export async function signUp(email: string, password: string): Promise<AuthResponse> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    })

    return {
        user: data.user,
        session: data.session,
        error,
    }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    return {
        user: data.user,
        session: data.session,
        error,
    }
}

export async function signInWithOAuth(provider: 'google' | 'github' | 'azure' | 'facebook', plan?: string) {
    const supabase = createBrowserClient()
    const redirectUrl = new URL('/auth/callback', window.location.origin)

    if (plan && ['pro', 'max'].includes(plan)) {
        redirectUrl.searchParams.set('plan', plan)
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl.toString(),
        },
    })

    return { data, error }
}

export async function signOut() {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signOut()
    return { error }
}

export async function getCurrentUser(): Promise<User | null> {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getSession(): Promise<Session | null> {
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

export async function resetPassword(email: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { data, error }
}

export async function updatePassword(newPassword: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    })

    return { data, error }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            callback(session?.user ?? null)
        }
    )

    return subscription
}

// =============================================================================
// Server-side auth
// =============================================================================

export async function getServerUser() {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    return user
}

export async function getServerSession() {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
        return null
    }

    return session
}

export async function requireAuth() {
    const user = await getServerUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    return user
}

/**
 * Get authenticated context with supabase client, userId, and companyId.
 * Replaces createUserScopedDb() for consumers that just need auth + client.
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
        const userIdHeader = request.headers.get('x-user-id')
        const userEmailHeader = request.headers.get('x-user-email')

        if (userIdHeader) {
            return {
                user: { id: userIdHeader, email: userEmailHeader } as User,
                userId: userIdHeader,
                email: userEmailHeader || '',
            }
        }

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

export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401
    ) {
        super(message)
        this.name = 'AuthError'
    }
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
