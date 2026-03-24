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
        path: '/dashboard/agare?tab=bolagsstamma',
        label: 'Årsmöte',
        aliases: ['årsmöte', 'arsmote', 'föreningsmöte'],
    },
    signatories: {
        path: '/dashboard/agare?tab=firmatecknare',
        label: 'Firmatecknare',
        aliases: ['firmatecknare', 'firmateckningsrätt', 'signatur'],
    },

    // -------------------------------------------------------------------------
    // Settings
    // -------------------------------------------------------------------------
    settings: {
        path: '/dashboard/installningar',
        label: 'Inställningar',
        aliases: ['inställningar', 'installningar', 'settings', 'konfiguration'],
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
  allowedCompanyTypes: [],
  coreTool: true,
    domain: 'common',
    keywords: ['navigera', 'gå till', 'öppna', 'visa', 'sida'],
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

export const showPreviewTool = defineTool<ShowPreviewParams, { previewType: string; limit: number; route: string }>({
    name: 'show_preview',
    description: 'Visa en förhandsgranskning av data direkt i chatten utan att navigera bort. Använd när användaren vill se en snabböversikt.',
    category: 'navigation',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['förhandsgranska', 'översikt', 'preview', 'visa'],
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['transactions', 'payslips', 'vat', 'income_statement', 'balance_sheet', 'employees'], description: 'Typ av data att visa' },
            limit: { type: 'number', description: 'Max antal poster att visa (standard: 5)' },
        },
        required: ['type'],
    },
    execute: async (params) => {
        const routeMap: Record<ShowPreviewParams['type'], string> = {
            transactions: '/dashboard/bokforing?tab=transaktioner',
            payslips: '/dashboard/loner?tab=lonebesked',
            vat: '/dashboard/rapporter?tab=momsdeklaration',
            income_statement: '/dashboard/rapporter?tab=resultatrakning',
            balance_sheet: '/dashboard/rapporter?tab=balansrakning',
            employees: '/dashboard/loner?tab=lonebesked',
        }

        const labelMap: Record<ShowPreviewParams['type'], string> = {
            transactions: 'transaktioner',
            payslips: 'lönebesked',
            vat: 'momsdeklaration',
            income_statement: 'resultaträkning',
            balance_sheet: 'balansräkning',
            employees: 'anställda',
        }

        return {
            success: true,
            data: {
                previewType: params.type,
                limit: params.limit || 5,
                route: routeMap[params.type],
            },
            message: `Här är en översikt av ${labelMap[params.type]}. Klicka för att se alla.`,
            navigation: {
                route: routeMap[params.type],
                label: `Visa alla ${labelMap[params.type]}`,
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
    description: 'Hämta kommande deadlines för moms, AGI och andra deklarationer. Använd när användaren frågar om kommande förfallodagar eller vad som behöver göras härnäst.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['deadline', 'förfallodag', 'kommande', 'datum', 'kalender'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        // Generate upcoming deadlines dynamically based on current date.
        // Swedish tax calendar: AGI due 12th monthly, Moms (quarterly) due 12th of month after quarter end.
        // TODO: Replace with real data from taxcalendar table when populated.
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() // 0-indexed

        const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

        const deadlines: Deadline[] = []

        // Next 3 AGI deadlines (due 12th of each month for previous month)
        for (let offset = 0; offset < 3; offset++) {
            const dueMonth = (month + offset) % 12
            const dueYear = year + Math.floor((month + offset) / 12)
            const prevMonth = dueMonth === 0 ? 11 : dueMonth - 1
            const prevYear = dueMonth === 0 ? dueYear - 1 : dueYear
            const dueDate = new Date(dueYear, dueMonth, 12)

            if (dueDate >= now) {
                deadlines.push({
                    type: 'AGI',
                    period: `${months[prevMonth]} ${prevYear}`,
                    dueDate: `12 ${months[dueMonth]} ${dueYear}`,
                    status: 'Kommande',
                })
            }
        }

        // Next quarterly moms deadline (due 12th of month after quarter end)
        const quarterEndMonths = [2, 5, 8, 11] // Mar, Jun, Sep, Dec (0-indexed)
        for (const qEnd of quarterEndMonths) {
            const dueMonth = (qEnd + 1) % 12
            const dueYear = qEnd === 11 ? year + 1 : year
            const dueDate = new Date(dueYear, dueMonth, 12)

            if (dueDate >= now) {
                const qLabel = `Q${Math.floor(qEnd / 3) + 1} ${qEnd === 11 && dueYear > year ? year : year}`
                deadlines.push({
                    type: 'Moms',
                    period: qLabel,
                    dueDate: `12 ${months[dueMonth]} ${dueYear}`,
                    status: 'Kommande',
                })
                break // Only next upcoming quarter
            }
        }

        return {
            success: true,
            data: deadlines,
            message: deadlines.length > 0
                ? `Du har ${deadlines.length} kommande deadlines.`
                : 'Inga kommande deadlines hittades.',
        }
    },
})

export const navigationTools = [
    navigateToTool,
    showPreviewTool,
]
