import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from './database/supabase-server'
import type { User } from '@supabase/supabase-js'

/**
 * Authentication result for API routes
 */
export interface AuthResult {
    user: User
    userId: string
    email: string
}

/**
 * API response helpers
 */
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

/**
 * Verify authentication for an API route
 * Returns the authenticated user or null
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
    try {
        // First check if middleware already verified and passed user info
        const userIdHeader = request.headers.get('x-user-id')
        const userEmailHeader = request.headers.get('x-user-email')

        if (userIdHeader) {
            // Middleware already verified - trust the headers
            return {
                user: { id: userIdHeader, email: userEmailHeader } as User,
                userId: userIdHeader,
                email: userEmailHeader || '',
            }
        }

        // Otherwise, verify via Supabase
        const supabase = await createServerSupabaseClient()
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

/**
 * Require authentication for an API route
 * Returns auth result or throws
 */
export async function requireApiAuth(request: NextRequest): Promise<AuthResult> {
    const auth = await verifyAuth(request)

    if (!auth) {
        throw new AuthError('Unauthorized', 401)
    }

    return auth
}

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: profile } = await supabase
            // @ts-ignore
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        return profile?.role === 'admin'
    } catch {
        return false
    }
}

/**
 * Require admin role for an API route
 */
export async function requireAdminAuth(request: NextRequest): Promise<AuthResult> {
    const auth = await requireApiAuth(request)

    if (!(await isAdmin(auth.userId))) {
        throw new AuthError('Admin access required', 403)
    }

    return auth
}

/**
 * Custom error class for auth errors
 */
export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401
    ) {
        super(message)
        this.name = 'AuthError'
    }
}

/**
 * Wrapper for protected API route handlers
 * Automatically handles auth and error responses
 */
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

/**
 * Wrapper for admin-only API route handlers
 */
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

/**
 * Get Supabase client with user context for RLS
 * Use this instead of getSupabaseAdmin() to respect row-level security
 */
export async function getAuthenticatedSupabase() {
    return createServerSupabaseClient()
}
