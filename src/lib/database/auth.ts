/**
 * Client-side Authentication Layer
 *
 * Unified auth helpers for browser components and hooks.
 * Strictly browser-safe to avoid boundary leaks.
 */

import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
import { createBrowserClient } from './client'

// =============================================================================
// Types
// =============================================================================

export interface AuthResponse {
    user: User | null
    session: Session | null
    error: SupabaseAuthError | null
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
