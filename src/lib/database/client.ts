/**
 * Client-side Database Client Factory
 *
 * Handles Supabase client creation for Browser/Client Components.
 * Uses @supabase/ssr for automatic cookie-based session handling.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _browserClient: SupabaseClient<Database> | null = null

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
