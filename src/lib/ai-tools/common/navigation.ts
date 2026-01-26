/**
 * Common AI Tools - Navigation
 *
 * Tools for navigating the dashboard with natural language support.
 */

import { defineTool } from '../registry'

// =============================================================================
// Route Mapping with Aliases for Natural Language
// =============================================================================

interface RouteInfo {
    path: string
    label: string
    aliases: string[]
}

const ROUTES: Record<string, RouteInfo> = {
    // -------------------------------------------------------------------------
    // Main
    // -------------------------------------------------------------------------
    dashboard: {
        path: '/dashboard',
        label: 'Startsidan',
        aliases: ['start', 'hem', 'home', 'översikt', 'huvudsidan'],
    },


    // -------------------------------------------------------------------------
    // Bokföring (Accounting)
    // -------------------------------------------------------------------------
    bookkeeping: {
        path: '/dashboard/bokforing',
        label: 'Bokföring',
        aliases: ['bokföring', 'bokforing', 'redovisning'],
    },
    transactions: {
        path: '/dashboard/bokforing?tab=transaktioner',
        label: 'Transaktioner',
        aliases: ['transaktioner', 'konton', 'kontoutdrag', 'bankkonto'],
    },
    invoices: {
        path: '/dashboard/bokforing?tab=fakturor',
        label: 'Fakturor',
        aliases: ['fakturor', 'faktura', 'kundfakturor'],
    },
    receipts: {
        path: '/dashboard/bokforing?tab=kvitton',
        label: 'Kvitton',
        aliases: ['kvitton', 'kvitto', 'utlägg', 'expense'],
    },
    inventory: {
        path: '/dashboard/bokforing?tab=inventarier',
        label: 'Inventarier',
        aliases: ['inventarier', 'tillgångar', 'inventarie'],
    },
    verifications: {
        path: '/dashboard/bokforing?tab=verifikationer',
        label: 'Verifikationer',
        aliases: ['verifikationer', 'verifikat', 'verifikation'],
    },

    // -------------------------------------------------------------------------
    // Rapporter (Reports)
    // -------------------------------------------------------------------------
    reports: {
        path: '/dashboard/rapporter',
        label: 'Rapporter',
        aliases: ['rapporter', 'rapport'],
    },
    income_statement: {
        path: '/dashboard/rapporter?tab=resultatrakning',
        label: 'Resultaträkning',
        aliases: ['resultaträkning', 'resultat', 'pl', 'profit'],
    },
    balance_sheet: {
        path: '/dashboard/rapporter?tab=balansrakning',
        label: 'Balansräkning',
        aliases: ['balansräkning', 'balans', 'balance'],
    },
    vat: {
        path: '/dashboard/rapporter?tab=momsdeklaration',
        label: 'Momsdeklaration',
        aliases: ['momsdeklaration', 'moms', 'momsen', 'vat', 'momsrapport'],
    },
    income_tax: {
        path: '/dashboard/rapporter?tab=inkomstdeklaration',
        label: 'Inkomstdeklaration',
        aliases: ['inkomstdeklaration', 'inkomst', 'deklaration', 'skatt'],
    },
    agi: {
        path: '/dashboard/rapporter?tab=agi',
        label: 'AGI',
        aliases: ['agi', 'arbetsgivardeklaration', 'arbetsgivaruppgift'],
    },
    annual_report: {
        path: '/dashboard/rapporter?tab=arsredovisning',
        label: 'Årsredovisning',
        aliases: ['årsredovisning', 'arsredovisning', 'årsrapport'],
    },
    annual_accounts: {
        path: '/dashboard/rapporter?tab=arsbokslut',
        label: 'Årsbokslut',
        aliases: ['årsbokslut', 'arsbokslut', 'bokslut'],
    },
    k10: {
        path: '/dashboard/rapporter?tab=k10',
        label: 'K10',
        aliases: ['k10', 'k10-blankett', 'utdelning beräkning'],
    },

    // -------------------------------------------------------------------------
    // Löner (Payroll)
    // -------------------------------------------------------------------------
    payroll: {
        path: '/dashboard/loner',
        label: 'Löner',
        aliases: ['löner', 'loner', 'lön', 'lon'],
    },
    payslips: {
        path: '/dashboard/loner?tab=lonebesked',
        label: 'Lönekörning',
        aliases: ['lönekörning', 'lönebesked', 'lonebesked', 'betala lön', 'lönespecifikation'],
    },
    benefits: {
        path: '/dashboard/loner?tab=benefits',
        label: 'Förmåner',
        aliases: ['förmåner', 'benefits', 'naturaförmåner', 'friskvård'],
    },
    team: {
        path: '/dashboard/loner?tab=team',
        label: 'Team & Rapportering',
        aliases: ['team', 'anställda', 'personal', 'medarbetare'],
    },
    self_employment_fees: {
        path: '/dashboard/loner?tab=egenavgifter',
        label: 'Egenavgifter',
        aliases: ['egenavgifter', 'egen avgift', 'egenföretagare'],
    },
    shareholder_withdrawal: {
        path: '/dashboard/loner?tab=delagaruttag',
        label: 'Delägaruttag',
        aliases: ['delägaruttag', 'delagaruttag', 'uttag'],
    },

    // -------------------------------------------------------------------------
    // Ägare (Owners/Partners)
    // -------------------------------------------------------------------------
    owners: {
        path: '/dashboard/agare',
        label: 'Ägare',
        aliases: ['ägare', 'agare'],
    },
    share_register: {
        path: '/dashboard/agare?tab=aktiebok',
        label: 'Aktiebok',
        aliases: ['aktiebok', 'aktier', 'aktieregister'],
    },
    shareholders: {
        path: '/dashboard/agare?tab=delagare',
        label: 'Delägare',
        aliases: ['delägare', 'delagare', 'aktieägare'],
    },
    dividends: {
        path: '/dashboard/agare?tab=utdelning',
        label: 'Utdelning',
        aliases: ['utdelning', 'dividend', 'aktieutdelning'],
    },
    owner_info: {
        path: '/dashboard/agare?tab=agarinfo',
        label: 'Ägarinfo',
        aliases: ['ägarinfo', 'agarinfo', 'ägande', 'ägandestruktur'],
    },
    member_registry: {
        path: '/dashboard/agare?tab=medlemsregister',
        label: 'Medlemsregister',
        aliases: ['medlemsregister', 'medlemmar', 'föreningsmedlemmar'],
    },
    board_minutes: {
        path: '/dashboard/agare?tab=styrelseprotokoll',
        label: 'Styrelseprotokoll',
        aliases: ['styrelseprotokoll', 'styrelse', 'styrelsemöte', 'protokoll'],
    },
    general_meeting: {
        path: '/dashboard/agare?tab=bolagsstamma',
        label: 'Bolagsstämma',
        aliases: ['bolagsstämma', 'bolagsstamma', 'stämma', 'årsstämma'],
    },
    annual_meeting: {
        path: '/dashboard/agare?tab=arsmote',
        label: 'Årsmöte',
        aliases: ['årsmöte', 'arsmote', 'föreningsmöte'],
    },
    signatories: {
        path: '/dashboard/agare?tab=firmatecknare',
        label: 'Firmatecknare',
        aliases: ['firmatecknare', 'firmateckningsrätt', 'signatur'],
    },
    authorities: {
        path: '/dashboard/agare?tab=myndigheter',
        label: 'Myndigheter',
        aliases: ['myndigheter', 'bolagsverket', 'skatteverket'],
    },

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------
    settings: {
        path: '/dashboard/installningar',
        label: 'Inställningar',
        aliases: ['inställningar', 'installningar', 'settings', 'konfiguration'],
    },
    statistics: {
        path: '/dashboard/foretagsstatistik',
        label: 'Företagsstatistik',
        aliases: ['företagsstatistik', 'foretagsstatistik', 'statistik', 'nyckeltal'],
    },
}

type RouteName = keyof typeof ROUTES

// =============================================================================
// Natural Language Route Finder
// =============================================================================

/**
 * Find a route by natural language intent
 * Matches against route keys, labels, and aliases
 */
function findRouteByIntent(intent: string): RouteInfo | null {
    const normalizedIntent = intent.toLowerCase().trim()

    // First, try exact key match
    if (ROUTES[normalizedIntent]) {
        return ROUTES[normalizedIntent]
    }

    // Second, search through all routes for alias matches
    for (const [, route] of Object.entries(ROUTES)) {
        // Check label match
        if (route.label.toLowerCase() === normalizedIntent) {
            return route
        }

        // Check alias matches
        for (const alias of route.aliases) {
            if (alias.toLowerCase() === normalizedIntent) {
                return route
            }
            // Also check if intent contains the alias (for phrases like "visa mina kvitton")
            if (normalizedIntent.includes(alias.toLowerCase())) {
                return route
            }
        }
    }

    // Third, try partial matching on labels
    for (const route of Object.values(ROUTES)) {
        if (route.label.toLowerCase().includes(normalizedIntent) ||
            normalizedIntent.includes(route.label.toLowerCase())) {
            return route
        }
    }

    return null
}

// =============================================================================
// Navigation Tools
// =============================================================================

export interface NavigateToParams {
    page: RouteName | string
    newTab?: boolean
}

// Generate route list for AI description
const routeDescriptions = Object.entries(ROUTES)
    .map(([key, info]) => `${key} (${info.label})`)
    .join(', ')

export const navigateToTool = defineTool<NavigateToParams, { route: string }>({
    name: 'navigate_to',
    description: `Navigera användaren till en sida i dashboarden. Stödjer naturligt språk som "visa mina kvitton", "gå till löner", "öppna momsdeklarationen". Tillgängliga sidor: ${routeDescriptions}`,
    category: 'navigation',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            page: {
                type: 'string',
                description: 'Sidan att navigera till. Kan vara route-nyckel (t.ex. "receipts", "payroll") eller naturligt språk (t.ex. "mina kvitton", "löner", "momsdeklaration")'
            },
            newTab: { type: 'boolean', description: 'Öppna i ny flik (standard: false)' },
        },
        required: ['page'],
    },
    execute: async (params) => {
        // Try direct key lookup first
        const routeKey = params.page.toLowerCase() as RouteName
        let routeInfo: RouteInfo | null = ROUTES[routeKey] || null

        // If not found, try natural language matching
        if (!routeInfo) {
            routeInfo = findRouteByIntent(params.page)
        }

        // If still not found, check if it's a direct path
        if (!routeInfo) {
            if (params.page.startsWith('/')) {
                return {
                    success: true,
                    data: { route: params.page },
                    message: `Öppnar ${params.page}`,
                    navigation: { route: params.page, label: 'Öppna sida', newTab: params.newTab },
                }
            }

            // Provide helpful error with suggestions
            const suggestions = Object.entries(ROUTES)
                .filter(([_, info]) =>
                    info.label.toLowerCase().includes(params.page.toLowerCase().slice(0, 3)) ||
                    info.aliases.some(a => a.includes(params.page.toLowerCase().slice(0, 3)))
                )
                .map(([_, info]) => info.label)
                .slice(0, 3)

            const suggestionText = suggestions.length > 0
                ? ` Menade du: ${suggestions.join(', ')}?`
                : ''

            return {
                success: false,
                error: `Kunde inte hitta sidan "${params.page}".${suggestionText}`
            }
        }

        return {
            success: true,
            data: { route: routeInfo.path },
            message: `Öppnar ${routeInfo.label}`,
            navigation: { route: routeInfo.path, label: routeInfo.label, newTab: params.newTab },
        }
    },
})

// =============================================================================
// Show Preview Tool
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
            type: { type: 'string', enum: ['transactions', 'payslips', 'vat', 'income_statement', 'balance_sheet', 'employees'], description: 'Typ av data att visa' },
            limit: { type: 'number', description: 'Max antal poster att visa (standard: 5)' },
        },
        required: ['type'],
    },
    execute: async (params) => {
        const componentMap: Record<ShowPreviewParams['type'], { component: string; route: string }> = {
            transactions: { component: 'TransactionsTable', route: '/dashboard/bokforing?tab=transaktioner' },
            payslips: { component: 'PayslipsTable', route: '/dashboard/loner?tab=lonebesked' },
            vat: { component: 'VatSummary', route: '/dashboard/skatt?tab=momsdeklaration' },
            income_statement: { component: 'IncomeStatement', route: '/dashboard/rapporter/resultat' },
            balance_sheet: { component: 'BalanceSheet', route: '/dashboard/rapporter/balans' },
            employees: { component: 'EmployeeList', route: '/dashboard/loner?tab=lonebesked' },
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
// Deadlines Tool
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
    parameters: { type: 'object', properties: {} },
    execute: async () => {
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
                fullViewRoute: '/dashboard/skatt',
            },
        }
    },
})

export const navigationTools = [
    navigateToTool,
    showPreviewTool,
    getDeadlinesTool,
]
