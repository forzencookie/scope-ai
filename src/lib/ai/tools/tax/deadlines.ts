import { defineTool } from '../registry'
import { taxCalendarService, type TaxCalendarItem } from '@/services/tax'

export interface GetTaxDeadlinesParams {
    limit?: number
}

export const getTaxDeadlinesTool = defineTool<GetTaxDeadlinesParams, TaxCalendarItem[]>({
    name: 'get_tax_deadlines',
    description: 'Hämta kommande och försenade skattedeadlines (moms, AGI, deklaration, etc.). Använd när användaren frågar om vad som är på gång eller vilka skattefrister som gäller.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['deadline', 'förfallodatum', 'skattefrist', 'försenad', 'kommande', 'moms', 'agi', 'deklaration'],
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal deadlines att returnera (standard: 10)' },
        },
    },
    execute: async (params) => {
        try {
            const deadlines = await taxCalendarService.getPendingDeadlines(params.limit ?? 10)

            if (deadlines.length === 0) {
                return {
                    success: true,
                    data: [],
                    message: 'Inga kommande eller försenade skattedeadlines hittades.',
                }
            }

            const overdue = deadlines.filter(d => d.status === 'Försenad')
            const upcoming = deadlines.filter(d => d.status === 'Kommande')

            const lines = deadlines.map(d =>
                `${d.status === 'Försenad' ? '🔴' : '🟡'} **${d.title}** — ${d.dueDate}${d.status === 'Försenad' ? ' (FÖRSENAD)' : ''}`
            )

            return {
                success: true,
                data: deadlines,
                message: `${overdue.length > 0 ? `⚠️ ${overdue.length} försenad${overdue.length > 1 ? 'e' : ''} deadline${overdue.length > 1 ? 's' : ''}. ` : ''}${upcoming.length} kommande:\n\n${lines.join('\n')}`,
            }
        } catch (error) {
            console.error('[get_tax_deadlines]', error)
            return { success: false, error: 'Kunde inte hämta skattedeadlines.' }
        }
    },
})

export const deadlineTools = [getTaxDeadlinesTool]
