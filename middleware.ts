import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-server'

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/inbox',
    '/api/chat',
    '/api/transactions',
    '/api/invoices',
    '/api/receipts',
]

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/auth/callback',
    '/auth/reset-password',
    '/api/auth',
    '/',
]

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
    '/admin',
    '/api/admin',
]

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
    return routes.some(route => {
        if (route.endsWith('*')) {
            return pathname.startsWith(route.slice(0, -1))
        }
        return pathname === route || pathname.startsWith(route + '/')
    })
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // files with extensions
    ) {
        return NextResponse.next()
    }

    // Create response to pass to Supabase client
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase client with middleware cookie handling
    const supabase = createMiddlewareSupabaseClient(request, response)

    // Refresh session if needed - this updates cookies
    const { data: { user }, error } = await supabase.auth.getUser()

    const isAuthenticated = !error && !!user
    const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES)
    const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES)
    const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES)

    // Check admin routes
    if (isAdminRoute) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            loginUrl.searchParams.set('error', 'auth_required')
            return NextResponse.redirect(loginUrl)
        }

        // Check if user has admin role
        // Note: profiles table must exist for this to work
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user!.id)
                .single()

            const role = (profile as any)?.role
            if (!profile || role !== 'admin') {
                // Not an admin - redirect to dashboard with error
                const dashboardUrl = new URL('/dashboard', request.url)
                dashboardUrl.searchParams.set('error', 'admin_required')
                return NextResponse.redirect(dashboardUrl)
            }
        } catch (e) {
            // If profiles table doesn't exist yet, deny admin access
            const dashboardUrl = new URL('/dashboard', request.url)
            dashboardUrl.searchParams.set('error', 'admin_required')
            return NextResponse.redirect(dashboardUrl)
        }
    }

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from login/register pages
    if (isPublicRoute && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard/inkorg', request.url))
    }

    // Add user info to headers for API routes (so they don't need to re-fetch)
    if (isAuthenticated && pathname.startsWith('/api/')) {
        response.headers.set('x-user-id', user!.id)
        response.headers.set('x-user-email', user!.email || '')
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
