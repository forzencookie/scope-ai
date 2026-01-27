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
    plan: 'free' | 'demo' | 'starter' | 'professional' | 'enterprise'
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
            display: {
                component: 'SubscriptionPreview',
                title: 'Prenumeration',
                props: { data: status },
            },
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
            display: {
                component: 'DataTable',
                title: 'Aktiva integrationer',
                props: {
                    columns: ['Tjänst', 'Typ', 'Status', 'Senast synkad'],
                    rows: integrations.map(i => [
                        i.name,
                        i.type === 'bank' ? 'Bank' : i.type === 'calendar' ? 'Kalender' : i.type === 'payment' ? 'Betalning' : i.type === 'email' ? 'E-post' : i.type === 'accounting' ? 'Bokföring' : 'Annat',
                        i.status === 'connected' ? '🟢 Ansluten' : i.status === 'pending' ? '🟡 Väntar' : i.status === 'error' ? '🔴 Fel' : '⚪ Ej ansluten',
                        i.lastSync ? new Date(i.lastSync).toLocaleString('sv-SE') : '-',
                    ]),
                },
            },
            navigation: {
                route: '/dashboard/installningar?tab=integrations',
                label: 'Hantera integrationer',
            },
        }
    },
})

export interface ConnectBankParams {
    bankName: string
    accountType?: 'business' | 'personal'
}

export const connectBankAccountTool = defineTool<ConnectBankParams, { initiated: boolean; redirectUrl?: string }>({
    name: 'connect_bank_account',
    description: 'Initiera koppling till bankkonto via Open Banking (PSD2). Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            bankName: { type: 'string', description: 'Bankens namn (t.ex. SEB, Nordea, Swedbank, Handelsbanken)' },
            accountType: { type: 'string', enum: ['business', 'personal'], description: 'Kontotyp' },
        },
        required: ['bankName'],
    },
    execute: async (params, context) => {
        const userId = context?.userId
        const companyId = context?.companyId

        if (!userId) {
            return {
                success: false,
                error: 'Användare ej autentiserad',
            }
        }

        const supportedBanks = ['SEB', 'Nordea', 'Swedbank', 'Handelsbanken', 'Danske Bank', 'Länsförsäkringar']
        const bankMatch = supportedBanks.find(b => b.toLowerCase().includes(params.bankName.toLowerCase()))

        if (!bankMatch) {
            return {
                success: false,
                error: `${params.bankName} stöds inte ännu. Stödda banker: ${supportedBanks.join(', ')}`,
            }
        }

        // Initiate real bank connection in database
        const result = await settingsService.initiateBankConnection(
            userId,
            companyId || userId, // Use userId as fallback for companyId
            bankMatch,
            'tink' // Default provider
        )

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Kunde inte initiera bankkoppling',
            }
        }

        return {
            success: true,
            data: {
                initiated: true,
                redirectUrl: result.redirectUrl,
            },
            message: `Redo att koppla ${bankMatch}. Du kommer att omdirigeras till bankens inloggning.`,
            confirmationRequired: {
                title: 'Anslut bankkonto',
                description: `Du kommer att omdirigeras till ${bankMatch} för att auktorisera åtkomst till ditt företagskonto.`,
                summary: [
                    { label: 'Bank', value: bankMatch },
                    { label: 'Kontotyp', value: params.accountType === 'personal' ? 'Privat' : 'Företag' },
                    { label: 'Åtkomst', value: 'Läsa transaktioner & saldon' },
                ],
                action: { toolName: 'connect_bank_account', params },
            },
        }
    },
})

export interface SyncBankParams {
    integrationId?: string
    days?: number
}

export const syncBankTransactionsTool = defineTool<SyncBankParams, { synced: number; newTransactions: number }>({
    name: 'sync_bank_transactions',
    description: 'Synka banktransaktioner manuellt från anslutna bankkonton.',
    category: 'write',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            integrationId: { type: 'string', description: 'Specifik integration att synka (alla om utelämnad)' },
            days: { type: 'number', description: 'Antal dagar bakåt att synka (standard: 30)' },
        },
    },
    execute: async (params) => {
        const days = params.days || 30

        // Sync real bank transactions
        const result = await settingsService.syncBankTransactions(params.integrationId, days)

        if (result.errors.length > 0) {
            return {
                success: false,
                error: result.errors.join('. '),
                data: {
                    synced: result.synced,
                    newTransactions: result.newTransactions,
                },
            }
        }

        if (result.synced === 0) {
            return {
                success: true,
                data: result,
                message: 'Inga anslutna bankkonton hittades. Anslut ett bankkonto först.',
                navigation: {
                    route: '/dashboard/installningar?tab=integrations',
                    label: 'Anslut bank',
                },
            }
        }

        return {
            success: true,
            data: {
                synced: result.synced,
                newTransactions: result.newTransactions,
            },
            message: `Synkade ${days} dagars transaktioner från ${result.synced} bank${result.synced > 1 ? 'er' : ''}. ${result.newTransactions} nya transaktioner importerades.`,
            navigation: {
                route: '/dashboard/bokforing?tab=transaktioner',
                label: 'Visa transaktioner',
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
    connectBankAccountTool,
    syncBankTransactionsTool,
]
