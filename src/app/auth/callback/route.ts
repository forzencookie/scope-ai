import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * OAuth callback handler
 * Exchanges the auth code for a session and redirects to dashboard
 * 
 * SECURITY: Validates that session exchange succeeds before redirecting
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth provider errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'oauth_error')
    loginUrl.searchParams.set('message', errorDescription || 'Authentication failed')
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    console.error('OAuth callback missing code parameter')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(loginUrl)
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in auth callback')
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'config_error')
    return NextResponse.redirect(loginUrl)
  }

  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Failed to exchange code for session:', exchangeError.message)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'exchange_failed')
    loginUrl.searchParams.set('message', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  // Verify the session was created successfully
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Failed to verify user after session exchange:', userError?.message)
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', 'verification_failed')
    return NextResponse.redirect(loginUrl)
  }

  // Success - redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
