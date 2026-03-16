/**
 * Common AI Tools - Settings
 *
 * Tools for managing user and company settings, integrations,
 * notifications, and subscription.
 * 
 * Uses settings-service.ts to query real data from Supabase.
 */

import { defineTool } from '../registry'
import { settingsService } from '@/services/settings-service'
import type {
    SubscriptionStatus as ServiceSubscriptionStatus,
    NotificationPreferences as ServiceNotificationPreferences,
    Integration as ServiceIntegration,
} from '@/services/settings-service'

// =============================================================================
// Subscription & Billing Tools
// =============================================================================

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

export const getSubscriptionStatusTool = defineTool<Record<string, never>, SubscriptionStatus>({
    name: 'get_subscription_status',
    description: 'Visa aktuell prenumerationsstatus, användning och faktureringsinformation.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'common',
    keywords: ['prenumeration', 'plan', 'fakturering', 'subscription'],
    parameters: { type: 'object', properties: {} },
    execute: async (_params, context) => {
        // Get real subscription status from database
        const userId = context?.userId
        if (!userId) {
            return {
                success: false,
                error: 'Användare ej autentiserad',
            }
        }

        const status = await settingsService.getSubscriptionStatus(userId)
        if (!status) {
            return {
                success: false,
                error: 'Kunde inte hämta prenumerationsstatus',
            }
        }

        const usagePercent = status.usageThisMonth.aiRequestsLimit > 0
            ? Math.round((status.usageThisMonth.aiRequests / status.usageThisMonth.aiRequestsLimit) * 100)
            : 0

        return {
            success: true,
            data: status,
            message: `Du har ${status.plan}-planen. Använt ${usagePercent}% av AI-förfrågningar (${status.usageThisMonth.aiRequests}/${status.usageThisMonth.aiRequestsLimit}) denna månad.`,
            navigation: {
                route: '/dashboard/installningar?tab=billing',
                label: 'Hantera prenumeration',
            },
        }
    },
})

// =============================================================================
// Notification Preferences Tools
// =============================================================================

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

export interface UpdateNotificationParams {
    channel: 'email' | 'push'
    setting: string
    enabled: boolean
}

export const getNotificationPreferencesTool = defineTool<Record<string, never>, NotificationPreferences>({
    name: 'get_notification_preferences',
    description: 'Visa aktuella notifikationsinställningar för e-post och push.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'common',
    keywords: ['notifikation', 'påminnelse', 'e-post', 'push'],
    parameters: { type: 'object', properties: {} },
    execute: async (_params, context) => {
        // Get real notification preferences from database
        const userId = context?.userId
        if (!userId) {
            return {
                success: false,
                error: 'Användare ej autentiserad',
            }
        }

        const prefs = await settingsService.getNotificationPreferences(userId)
        const enabledCount = Object.values(prefs.email).filter(Boolean).length

        return {
            success: true,
            data: prefs,
            message: `${enabledCount} e-postnotifieringar aktiverade. Push-notiser ${prefs.push.enabled ? 'på' : 'av'}.`,
            navigation: {
                route: '/dashboard/installningar?tab=notifications',
                label: 'Ändra notifikationer',
            },
        }
    },
})

export const updateNotificationPreferencesTool = defineTool<UpdateNotificationParams, NotificationPreferences>({
    name: 'update_notification_preferences',
    description: 'Ändra en notifikationsinställning (e-post eller push).',
    category: 'write',
    requiresConfirmation: false, // Low-risk change
    domain: 'common',
    keywords: ['ändra', 'notifikation', 'inställning'],
    parameters: {
        type: 'object',
        properties: {
            channel: { type: 'string', enum: ['email', 'push'], description: 'Kanal att ändra' },
            setting: { type: 'string', description: 'Inställning att ändra (t.ex. newInvoices, paymentReminders)' },
            enabled: { type: 'boolean', description: 'Aktivera eller inaktivera' },
        },
        required: ['channel', 'setting', 'enabled'],
    },
    execute: async (params, context) => {
        const userId = context?.userId
        if (!userId) {
            return {
                success: false,
                error: 'Användare ej autentiserad',
            }
        }

        // Update in database
        const updatedPrefs = await settingsService.updateNotificationPreference(
            userId,
            params.channel,
            params.setting,
            params.enabled
        )

        const settingLabels: Record<string, string> = {
            newInvoices: 'Nya fakturor',
            paymentReminders: 'Betalningspåminnelser',
            monthlyReports: 'Månadsrapporter',
            importantDates: 'Viktiga datum',
            taxDeadlines: 'Skattedeadlines',
            enabled: 'Push-notiser',
            urgentOnly: 'Endast brådskande',
        }

        const label = settingLabels[params.setting] || params.setting

        return {
            success: true,
            data: updatedPrefs,
            message: `${label} ${params.enabled ? 'aktiverat' : 'inaktiverat'} för ${params.channel === 'email' ? 'e-post' : 'push'}.`,
        }
    },
})

// =============================================================================
// Integration Tools
// =============================================================================

export interface Integration {
    id: string
    name: string
    type: 'bank' | 'calendar' | 'payment' | 'accounting' | 'email' | 'other'
    status: 'connected' | 'disconnected' | 'error' | 'pending'
    connectedAt?: string | null
    lastSync?: string | null
    accountInfo?: string
    provider?: string
}

export const listActiveIntegrationsTool = defineTool<Record<string, never>, Integration[]>({
    name: 'list_active_integrations',
    description: 'Visa alla aktiva integrationer och deras status.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'common',
    keywords: ['integration', 'koppling', 'anslutning', 'bank'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        // Get real integrations from database
        const integrations = await settingsService.getIntegrations()

        const connectedCount = integrations.filter(i => i.status === 'connected').length

        return {
            success: true,
            data: integrations,
            message: integrations.length === 0
                ? 'Inga integrationer konfigurerade ännu.'
                : `${connectedCount} av ${integrations.length} integrationer anslutna.`,
            navigation: {
                route: '/dashboard/installningar?tab=integrations',
                label: 'Hantera integrationer',
            },
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const settingsTools = [
    getSubscriptionStatusTool,
    getNotificationPreferencesTool,
    updateNotificationPreferencesTool,
    listActiveIntegrationsTool,
]
