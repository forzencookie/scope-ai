/**
 * Common AI Tools - Navigation
 */

import { defineTool } from '../registry'

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
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
        const deadlines: Deadline[] = []

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

        const quarterEndMonths = [2, 5, 8, 11]
        for (const qEnd of quarterEndMonths) {
            const dueMonth = (qEnd + 1) % 12
            const dueYear = qEnd === 11 ? year + 1 : year
            const dueDate = new Date(dueYear, dueMonth, 12)
            if (dueDate >= now) {
                deadlines.push({
                    type: 'Moms',
                    period: `Q${Math.floor(qEnd / 3) + 1} ${year}`,
                    dueDate: `12 ${months[dueMonth]} ${dueYear}`,
                    status: 'Kommande',
                })
                break
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
    showPreviewTool,
]
