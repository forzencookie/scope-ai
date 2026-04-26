import { defineTool } from '../registry'
import { taxDeclarationService } from '@/services/tax'

export interface GetDeclarationsParams {
    taxYear?: number
}

export const getIncomeDeclarationsTool = defineTool<GetDeclarationsParams, Awaited<ReturnType<typeof taxDeclarationService.getIncomeDeclarations>>>({
    name: 'get_income_declarations',
    description: 'Hämta sparade inkomstdeklarationer (INK2/NE). Visa status, skattebelopp och om de är inskickade. Använd när användaren frågar om deklarationsstatus.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['inkomstdeklaration', 'INK2', 'NE-bilaga', 'deklaration', 'skatt', 'status'],
    parameters: {
        type: 'object',
        properties: {
            taxYear: { type: 'number', description: 'Beskattningsår (standard: alla tillgängliga)' },
        },
    },
    execute: async (params) => {
        try {
            const declarations = await taxDeclarationService.getIncomeDeclarations(params.taxYear)
            if (declarations.length === 0) {
                return { success: true, data: [], message: 'Inga inkomstdeklarationer hittades.' }
            }
            const lines = declarations.map(d =>
                `📄 **${d.taxYear}** — ${d.status} | Skatt: ${d.taxAmount.toLocaleString('sv-SE')} kr${d.submittedAt ? ` | Inskickad: ${d.submittedAt.slice(0, 10)}` : ''}`
            )
            return {
                success: true,
                data: declarations,
                message: `${declarations.length} deklaration${declarations.length > 1 ? 'er' : ''}:\n\n${lines.join('\n')}`,
            }
        } catch (error) {
            console.error('[get_income_declarations]', error)
            return { success: false, error: 'Kunde inte hämta inkomstdeklarationer.' }
        }
    },
})

export const getAnnualClosingsTool = defineTool<GetDeclarationsParams, Awaited<ReturnType<typeof taxDeclarationService.getAnnualClosings>>>({
    name: 'get_annual_closings',
    description: 'Hämta status på årsbokslut. Visar om bokslutet är klart, pågående eller inskickat.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['årsbokslut', 'bokslut', 'årsredovisning', 'status', 'räkenskapsår'],
    parameters: {
        type: 'object',
        properties: {
            taxYear: { type: 'number', description: 'Räkenskapsår' },
        },
    },
    execute: async (params) => {
        try {
            const closings = await taxDeclarationService.getAnnualClosings(params.taxYear)
            if (closings.length === 0) {
                return { success: true, data: [], message: 'Inga bokslut hittades.' }
            }
            const lines = closings.map(c =>
                `📋 **${c.fiscalYear}** — ${c.status} | Resultat: ${c.netProfit.toLocaleString('sv-SE')} kr | Tillgångar: ${c.totalAssets.toLocaleString('sv-SE')} kr`
            )
            return {
                success: true,
                data: closings,
                message: `${closings.length} bokslut:\n\n${lines.join('\n')}`,
            }
        } catch (error) {
            console.error('[get_annual_closings]', error)
            return { success: false, error: 'Kunde inte hämta bokslut.' }
        }
    },
})

export const taxRecordTools = [getIncomeDeclarationsTool, getAnnualClosingsTool]
