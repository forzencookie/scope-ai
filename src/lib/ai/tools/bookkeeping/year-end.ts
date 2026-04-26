import { defineTool } from '../registry'
import { closingEntryService, type ClosingEntryPreview } from '@/services/accounting'
import { formatCurrency } from '@/lib/utils'

export interface YearEndParams {
    year: number
    companyType?: 'AB' | 'EF'
}

export interface YearEndExecuteResult {
    verificationIds: string[]
    netResult: number
}

export const previewYearEndCloseTool = defineTool<YearEndParams, ClosingEntryPreview>({
    name: 'preview_year_end_close',
    description: 'Förhandsgranska bokslutsposter för ett räkenskapsår. Beräknar avskrivningar, periodiseringar, skatteposter och bokslutsjusteringar. Kör alltid detta INNAN run_year_end_close.',
    category: 'read',
    domain: 'bokforing',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['bokslut', 'bokslutspost', 'avslut', 'räkenskapsår', 'förhandsgranska', 'årsavslut'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår (t.ex. 2024)' },
            companyType: { type: 'string', enum: ['AB', 'EF'], description: 'Bolagsform (AB eller EF)' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        try {
            const companyType = (params.companyType ?? 'AB') as 'AB' | 'EF'
            const preview = await closingEntryService.previewClosingEntries(params.year, companyType)

            if (preview.alreadyClosed) {
                return { success: false, error: `Bokslut för ${params.year} är redan genomfört.` }
            }

            const allEntries = [
                ...preview.revenueEntries,
                ...preview.expenseEntries,
                ...preview.resultTransfer,
                ...(preview.taxEntry ?? []),
            ]

            const entryLines = allEntries.slice(0, 6).map(e =>
                `• ${e.description} (${e.account}): D ${formatCurrency(e.debit)} / K ${formatCurrency(e.credit)}`
            )
            if (allEntries.length > 6) entryLines.push(`• … (${allEntries.length - 6} fler poster)`)

            return {
                success: true,
                data: preview,
                message: [
                    `📋 **Bokslutsposter ${params.year} — förhandsgranskning**`,
                    ``,
                    `Resultat före skatt: **${formatCurrency(preview.resultBeforeTax)}**`,
                    `Bolagsskatt: ${formatCurrency(preview.corporateTax)}`,
                    `Nettoresultat: **${formatCurrency(preview.netResult)}**`,
                    ``,
                    `${allEntries.length} bokslutsposter:`,
                    entryLines.join('\n'),
                    ``,
                    `Bekräfta med run_year_end_close för att bokföra posterna.`,
                ].join('\n'),
            }
        } catch (error) {
            console.error('[preview_year_end_close]', error)
            return { success: false, error: `Kunde inte förhandsgranska bokslut: ${error instanceof Error ? error.message : 'okänt fel'}` }
        }
    },
})

export const runYearEndCloseTool = defineTool<YearEndParams, YearEndExecuteResult>({
    name: 'run_year_end_close',
    description: 'Bokför bokslutsposter för räkenskapsåret. Kräver bekräftelse. Kör alltid preview_year_end_close först.',
    category: 'write',
    domain: 'bokforing',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    keywords: ['bokslut', 'kör bokslut', 'bokslutsposter', 'stäng räkenskapsår', 'årsavslut'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår' },
            companyType: { type: 'string', enum: ['AB', 'EF'], description: 'Bolagsform' },
        },
        required: ['year'],
    },
    execute: async (params, context) => {
        const companyType = (params.companyType ?? 'AB') as 'AB' | 'EF'

        if (!context.isConfirmed) {
            const preview = await closingEntryService.previewClosingEntries(params.year, companyType)
            const allEntries = [
                ...preview.revenueEntries,
                ...preview.expenseEntries,
                ...preview.resultTransfer,
                ...(preview.taxEntry ?? []),
            ]
            return {
                success: true,
                confirmationRequired: {
                    id: crypto.randomUUID(),
                    type: 'run_year_end_close',
                    title: `Kör bokslut ${params.year}`,
                    description: `Skapar verifikationer med ${allEntries.length} bokslutsposter.`,
                    summary: [
                        { label: 'Räkenskapsår', value: String(params.year) },
                        { label: 'Bolagsform', value: companyType },
                        { label: 'Antal poster', value: String(allEntries.length) },
                        { label: 'Resultat före skatt', value: formatCurrency(preview.resultBeforeTax) },
                        { label: 'Bolagsskatt', value: formatCurrency(preview.corporateTax) },
                        { label: 'Nettoresultat', value: formatCurrency(preview.netResult) },
                    ],
                    action: { toolName: 'run_year_end_close', params },
                },
            }
        }

        try {
            const result = await closingEntryService.executeClosingEntries(params.year, companyType)
            return {
                success: true,
                data: result,
                message: `✅ Bokslut ${params.year} klart. Nettoresultat: ${formatCurrency(result.netResult)}. ${result.verificationIds.length} verifikationer skapade.`,
            }
        } catch (error) {
            console.error('[run_year_end_close]', error)
            return { success: false, error: `Kunde inte köra bokslut: ${error instanceof Error ? error.message : 'okänt fel'}` }
        }
    },
})

export const yearEndTools = [previewYearEndCloseTool, runYearEndCloseTool]
