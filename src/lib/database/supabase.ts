import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Environment variables - validated lazily to prevent build-time crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Cached client instance
let _supabaseClient: SupabaseClient<Database> | null = null
let _supabaseAdmin: SupabaseClient<Database> | null = null

/**
 * Check if Supabase is properly configured
 * Use this to gracefully handle missing configuration
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Get the Supabase client for client-side operations
 * Uses @supabase/ssr for proper cookie-based session handling
 * 
 * @throws Error if Supabase environment variables are not configured
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  if (!_supabaseClient) {
    // Use createBrowserClient from @supabase/ssr for proper cookie handling
    _supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return _supabaseClient
}

/**
 * Supabase client for client-side operations
 * @deprecated Use getSupabaseClient() for better error handling
 * 
 * WARNING: This export will throw at runtime if env vars are missing,
 * but allows the module to be imported without crashing during build.
 */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient<Database>]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

/**
 * Supabase admin client for server-side operations
 * Uses service role key - bypasses RLS, use with caution
 * Only use in API routes or server components
 * 
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
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

  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return _supabaseAdmin
}
