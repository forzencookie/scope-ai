/**
 * Settings Service (Shared/Client)
 *
 * Manages user settings, integrations, bank connections, and subscription data.
 * This file is safe to import in Client Components.
 */

import { createBrowserClient } from '@/lib/database/client'

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
// Notification Settings
// =============================================================================

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
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

    for (const row of data) {
        const parsed: unknown = row.value ? JSON.parse(row.value) : null
        if (row.key === 'notification_email' && typeof parsed === 'object' && parsed !== null) {
            prefs.email = { ...prefs.email, ...(parsed as Record<string, boolean>) }
        }
        if (row.key === 'notification_push' && typeof parsed === 'object' && parsed !== null) {
            prefs.push = { ...prefs.push, ...(parsed as Record<string, boolean>) }
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
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,key'
        })

    return updated
}

// =============================================================================
// Integrations
// =============================================================================

export const INTEGRATION_TYPE_MAP: Record<string, Integration['type']> = {
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
        name: row.name || row.integration_id || '',
        type: (row.type || INTEGRATION_TYPE_MAP[row.integration_id || ''] || 'other') as Integration['type'],
        status: row.connected ? 'connected' : (row.status || 'disconnected') as Integration['status'],
        connectedAt: row.connected_at || null,
        lastSync: row.last_sync_at || null,
        provider: row.provider ?? undefined,
    }))
}
