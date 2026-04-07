import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/database/server'

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
    '/logga-in',
    '/register',
    '/auth/callback',
    '/auth/reset-password',
    '/api/auth',
    '/api/waitlist',
    '/',
    '/vantelista',
]

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = [
    '/admin',
    '/api/admin',
    '/test-ui',
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
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create Supabase client with middleware cookie handling
    const supabase = createMiddlewareClient(request, response)

    // Refresh session if needed - this updates cookies
    const { data: { user }, error } = await supabase.auth.getUser()

    const isAuthenticated = !error && !!user
    const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES)
    const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES)
    const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES)

    // Check admin routes
    if (isAdminRoute) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/logga-in', request.url)
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

            const role = profile?.role
            if (!profile || role !== 'admin') {
                // Not an admin - redirect to dashboard with error
                const dashboardUrl = new URL('/dashboard', request.url)
                dashboardUrl.searchParams.set('error', 'admin_required')
                return NextResponse.redirect(dashboardUrl)
            }
        } catch {
            // If profiles table doesn't exist yet, deny admin access
            const dashboardUrl = new URL('/dashboard', request.url)
            dashboardUrl.searchParams.set('error', 'admin_required')
            return NextResponse.redirect(dashboardUrl)
        }
    }

    const isPreLaunch = process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE === 'true'

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/logga-in', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // For protected routes: verify user exists + check pre-launch gate (single query)
    if (isProtectedRoute && isAuthenticated && user) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (!profile) {
                // User was deleted from database - clear session and redirect
                response.cookies.delete('sb-access-token')
                response.cookies.delete('sb-refresh-token')
                const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
                if (projectRef) {
                    response.cookies.delete(`sb-${projectRef}-auth-token`)
                }
                const loginUrl = new URL('/logga-in', request.url)
                loginUrl.searchParams.set('error', 'account_deleted')
                return NextResponse.redirect(loginUrl)
            }

            // Pre-launch gate — admins bypass
            if (isPreLaunch && profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/vantelista', request.url))
            }
        } catch (e) {
            console.warn('Could not verify user profile:', e)
            if (isPreLaunch) {
                return NextResponse.redirect(new URL('/vantelista', request.url))
            }
        }
    }

    // Redirect authenticated users away from login/register pages
    if (isPublicRoute && isAuthenticated && ['/login', '/logga-in', '/register'].includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
