/**
 * Settings Service
 *
 * Manages user settings, integrations, bank connections, and subscription data.
 * Queries real data from Supabase with proper authentication.
 */

import { createBrowserClient } from '@/lib/database/client'
import { createServerClient } from '@/lib/database/client'
import { getMonthlyUsage, checkUsageLimits } from '@/lib/model-auth'

// =============================================================================
// Types
// =============================================================================

export interface UserProfile {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    role: string
    subscription_tier: string | null
    created_at: string
    updated_at: string
}

export interface SubscriptionStatus {
    plan: 'starter' | 'professional' | 'max'
    status: 'active' | 'trial' | 'cancelled' | 'past_due'
    currentPeriodEnd: string
    usageThisMonth: {
        aiRequests: number
        aiRequestsLimit: number
        tokensUsed: number
        tokensLimit: number
    }
    billingEmail: string | null
    remainingTokens: number
}

export interface NotificationPreferences {
    email: {
        newInvoices: boolean
        paymentReminders: boolean
        monthlyReports: boolean
        importantDates: boolean
        taxDeadlines: boolean
    }
    push: {
        enabled: boolean
        urgentOnly: boolean
    }
}

export interface Integration {
    id: string
    name: string
    type: 'bank' | 'calendar' | 'payment' | 'accounting' | 'email' | 'other'
    status: 'connected' | 'disconnected' | 'error' | 'pending'
    connectedAt: string | null
    lastSync: string | null
    accountInfo?: string
    provider?: string
}

// =============================================================================
// Tier Limits Configuration
// =============================================================================

const TIER_LIMITS: Record<string, { tokens: number; requests: number }> = {
    starter: { tokens: 500000, requests: 500 },
    professional: { tokens: 2000000, requests: 2000 },
    max: { tokens: 10000000, requests: 10000 },
}

// =============================================================================
// Profile & Subscription
// =============================================================================

/**
 * Get user profile from the database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, subscription_tier, created_at, updated_at')
        .eq('id', userId)
        .single()

    if (error || !data) {
        console.error('[SettingsService] Failed to fetch profile:', error)
        return null
    }

    return data as UserProfile
}

/**
 * Get subscription status with real usage data
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    const profile = await getUserProfile(userId)
    if (!profile) return null

    // Get real usage from model-auth
    const usage = await getMonthlyUsage(userId)
    const limits = await checkUsageLimits(userId)

    const tier = (profile.subscription_tier || 'starter') as keyof typeof TIER_LIMITS
    const tierConfig = TIER_LIMITS[tier] || TIER_LIMITS.starter

    // Calculate period end (end of current month)
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
        plan: tier as SubscriptionStatus['plan'],
        status: 'active', // Would integrate with Stripe in production
        currentPeriodEnd: periodEnd.toISOString().split('T')[0],
        usageThisMonth: {
            aiRequests: usage?.requestsCount || 0,
            aiRequestsLimit: tierConfig.requests,
            tokensUsed: usage?.tokensUsed || 0,
            tokensLimit: tierConfig.tokens,
        },
        billingEmail: profile.email,
        remainingTokens: limits?.tokensRemaining ?? tierConfig.tokens,
    }
}

// =============================================================================
// Notification Settings
// =============================================================================

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
    email: {
        newInvoices: true,
        paymentReminders: true,
        monthlyReports: false,
        importantDates: true,
        taxDeadlines: true,
    },
    push: {
        enabled: true,
        urgentOnly: false,
    },
}

/**
 * Get notification preferences from settings table
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .eq('user_id', userId)
        .in('key', ['notification_email', 'notification_push'])

    if (error || !data || data.length === 0) {
        return DEFAULT_NOTIFICATIONS
    }

    const prefs = { ...DEFAULT_NOTIFICATIONS }

    for (const row of (data as unknown) as { key: string; value: unknown }[]) {
        if (row.key === 'notification_email' && typeof row.value === 'object') {
            prefs.email = { ...prefs.email, ...(row.value as Record<string, boolean>) }
        }
        if (row.key === 'notification_push' && typeof row.value === 'object') {
            prefs.push = { ...prefs.push, ...(row.value as Record<string, boolean>) }
        }
    }

    return prefs
}

/**
 * Update a notification preference
 */
export async function updateNotificationPreference(
    userId: string,
    channel: 'email' | 'push',
    setting: string,
    enabled: boolean
): Promise<NotificationPreferences> {
    const supabase = createBrowserClient()
    const key = `notification_${channel}`

    // Get current settings
    const current = await getNotificationPreferences(userId)
    const updated = { ...current }

    if (channel === 'email') {
        (updated.email as Record<string, boolean>)[setting] = enabled
    } else {
        (updated.push as Record<string, boolean>)[setting] = enabled
    }

    // Upsert the setting
    const value = channel === 'email' ? updated.email : updated.push

    await supabase
        .from('settings')
        .upsert({
            user_id: userId,
            key,
            value,
            updated_at: new Date().toISOString(),
        } as never, {
            onConflict: 'user_id,key'
        })

    return updated
}

// =============================================================================
// Integrations
// =============================================================================

const INTEGRATION_TYPE_MAP: Record<string, Integration['type']> = {
    bankgirot: 'payment',
    swish: 'payment',
    'google-calendar': 'calendar',
    skatteverket: 'accounting',
}

/**
 * Get all integrations for the current user
 */
export async function getIntegrations(): Promise<Integration[]> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
        .from('integrations')
        .select('id, integration_id, name, type, status, connected, connected_at, last_sync_at, provider, service, metadata')

    if (error) {
        console.error('[SettingsService] Failed to fetch integrations:', error)
        return []
    }

    return (data || []).map((row): Integration => ({
        id: row.id,
        name: row.name || row.integration_id,
        type: (row.type || INTEGRATION_TYPE_MAP[row.integration_id || ''] || 'other') as Integration['type'],
        status: row.connected ? 'connected' : (row.status || 'disconnected') as Integration['status'],
        connectedAt: row.connected_at,
        lastSync: row.last_sync_at,
        provider: row.provider ?? undefined,
    }))
}

// =============================================================================
// Export
// =============================================================================

export const settingsService = {
    getUserProfile,
    getSubscriptionStatus,
    getNotificationPreferences,
    updateNotificationPreference,
    getIntegrations,
}
