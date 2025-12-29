/**
 * AI Navigation Tools
 * 
 * Tools for navigating the user to different dashboard pages.
 * These don't mutate data but control what the user sees.
 */

import { defineTool } from './registry'

// =============================================================================
// Route Mapping
// =============================================================================

const ROUTES = {
    dashboard: {
        path: '/dashboard',
        label: 'Startsidan',
    },
    transactions: {
        path: '/dashboard/accounting/verifikationer',
        label: 'Transaktioner',
    },
    bookkeeping: {
        path: '/dashboard/accounting',
        label: 'Bokföring',
    },
    payroll: {
        path: '/dashboard/payroll',
        label: 'Löner',
    },
    reports: {
        path: '/dashboard/reports',
        label: 'Rapporter',
    },
    vat: {
        path: '/dashboard/myndigheter/momsdeklaration',
        label: 'Momsdeklaration',
    },
    inbox: {
        path: '/dashboard/inkorg',
        label: 'Inkorg',
    },
    statistics: {
        path: '/dashboard/foretagsstatistik',
        label: 'Statistik',
    },
    settings: {
        path: '/dashboard/installningar',
        label: 'Inställningar',
    },
} as const

type RouteName = keyof typeof ROUTES

// =============================================================================
// Navigation Tools
// =============================================================================

export interface NavigateToParams {
    page: RouteName | string
    newTab?: boolean
}

export const navigateToTool = defineTool<NavigateToParams, { route: string }>({
    name: 'navigate_to',
    description: `Navigera användaren till en sida i dashboarden. Tillgängliga sidor: ${Object.keys(ROUTES).join(', ')}`,
    category: 'navigation',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            page: {
                type: 'string',
                description: 'Sidan att navigera till (t.ex. "transactions", "payroll", "vat")',
            },
            newTab: {
                type: 'boolean',
                description: 'Öppna i ny flik (standard: false)',
            },
        },
        required: ['page'],
    },
    execute: async (params) => {
        const routeKey = params.page.toLowerCase() as RouteName
        const routeInfo = ROUTES[routeKey]

        if (!routeInfo) {
            // Try to use it as a direct path
            if (params.page.startsWith('/')) {
                return {
                    success: true,
                    data: { route: params.page },
                    message: `Öppnar ${params.page}`,
                    navigation: {
                        route: params.page,
                        label: 'Öppna sida',
                        newTab: params.newTab,
                    },
                }
            }

            return {
                success: false,
                error: `Okänd sida: "${params.page}". Tillgängliga: ${Object.keys(ROUTES).join(', ')}`,
            }
        }

        return {
            success: true,
            data: { route: routeInfo.path },
            message: `Öppnar ${routeInfo.label}`,
            navigation: {
                route: routeInfo.path,
                label: routeInfo.label,
                newTab: params.newTab,
            },
        }
    },
})

// =============================================================================
// Show Preview Tool (for inline rendering)
// =============================================================================

export interface ShowPreviewParams {
    type: 'transactions' | 'payslips' | 'vat' | 'income_statement' | 'balance_sheet' | 'employees'
    limit?: number
}

export const showPreviewTool = defineTool<ShowPreviewParams, null>({
    name: 'show_preview',
    description: 'Visa en förhandsgranskning av data direkt i chatten.',
    category: 'navigation',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['transactions', 'payslips', 'vat', 'income_statement', 'balance_sheet', 'employees'],
                description: 'Typ av data att visa',
            },
            limit: {
                type: 'number',
                description: 'Max antal poster att visa (standard: 5)',
            },
        },
        required: ['type'],
    },
    execute: async (params) => {
        // This tool delegates to the appropriate read tool
        // The AI workspace will handle the display component
        const componentMap: Record<ShowPreviewParams['type'], { component: string; route: string }> = {
            transactions: { component: 'TransactionsTable', route: '/dashboard/accounting/verifikationer' },
            payslips: { component: 'PayslipsTable', route: '/dashboard/payroll' },
            vat: { component: 'VatSummary', route: '/dashboard/myndigheter/momsdeklaration' },
            income_statement: { component: 'IncomeStatement', route: '/dashboard/reports' },
            balance_sheet: { component: 'BalanceSheet', route: '/dashboard/reports' },
            employees: { component: 'EmployeeList', route: '/dashboard/payroll' },
        }

        const config = componentMap[params.type]

        return {
            success: true,
            data: null,
            message: `Visar ${params.type}...`,
            display: {
                component: config.component as 'TransactionsTable',
                props: { limit: params.limit || 5 },
                fullViewRoute: config.route,
            },
        }
    },
})

// =============================================================================
// Get Upcoming Deadlines
// =============================================================================

export interface Deadline {
    type: string
    period: string
    dueDate: string
    amount?: number
    status: string
}

export const getDeadlinesTool = defineTool<Record<string, never>, Deadline[]>({
    name: 'get_upcoming_deadlines',
    description: 'Hämta kommande deadlines för moms, AGI och andra deklarationer.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async () => {
        // Would normally fetch from real services
        const deadlines: Deadline[] = [
            { type: 'Moms', period: 'Q4 2024', dueDate: '12 feb 2025', amount: 80000, status: 'Kommande' },
            { type: 'AGI', period: 'December 2024', dueDate: '12 jan 2025', amount: 47090, status: 'Väntar' },
        ]

        return {
            success: true,
            data: deadlines,
            message: `Du har ${deadlines.length} kommande deadlines.`,
            display: {
                component: 'DeadlinesList',
                props: { deadlines },
                title: 'Kommande deadlines',
                fullViewRoute: '/dashboard/myndigheter',
            },
        }
    },
})

// =============================================================================
// Export all navigation tools
// =============================================================================

export const navigationTools = [
    navigateToTool,
    showPreviewTool,
    getDeadlinesTool,
]
