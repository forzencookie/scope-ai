import { defineTool } from '../registry'
import { taxCalculationService } from '@/services/tax/tax-calculation-service'
import { formatCurrency } from '@/lib/utils'

export interface CalculateEgenavgifterParams {
    year?: number
    isReduced?: boolean
}

export interface EgenavgifterResult {
    realProfit: number
    revenue: number
    expenses: number
    rate: number
    avgifter: number
    nettoEfterAvgifter: number
    monthlyNet: number
}

export const calculateEgenavgifterTool = defineTool<CalculateEgenavgifterParams, EgenavgifterResult>({
    name: 'calculate_egenavgifter_ytd',
    description: 'Beräkna egenavgifter baserat på verkligt bokfört resultat. Ger korrekt beräkning med rätt skattesatser — använd alltid detta verktyg, beräkna aldrig egenavgifter själv.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: ['ef', 'hb', 'kb'],
    keywords: ['egenavgifter', 'sociala avgifter', 'enskild firma', 'handelsbolag', 'skatt', 'vinst', 'självständig'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår (standard: innevarande år)' },
            isReduced: { type: 'boolean', description: 'Nedsatt egenavgifter (t.ex. vid sjukdom, under 65 år)' },
        },
    },
    execute: async (params, context) => {
        const year = params.year ?? new Date().getFullYear()
        try {
            const raw = await taxCalculationService.getYTDProfitAndTax(
                year,
                { isReduced: params.isReduced ?? false },
                context.supabase,
            )

            const result: EgenavgifterResult = {
                realProfit: raw.realProfit,
                revenue: raw.revenue,
                expenses: raw.expenses,
                rate: raw.calculation.rate,
                avgifter: raw.calculation.avgifter,
                nettoEfterAvgifter: raw.calculation.nettoEfterAvgifter,
                monthlyNet: raw.calculation.monthlyNet,
            }

            return {
                success: true,
                data: result,
                message: [
                    `📊 **Egenavgifter ${year}** (baserat på bokföringen)`,
                    ``,
                    `Intäkter: ${formatCurrency(raw.revenue)}`,
                    `Kostnader: ${formatCurrency(raw.expenses)}`,
                    `**Resultat: ${formatCurrency(raw.realProfit)}**`,
                    ``,
                    `Egenavgifter (${(raw.calculation.rate * 100).toFixed(1)}%): **${formatCurrency(raw.calculation.avgifter)}**`,
                    `Netto efter avgifter: ${formatCurrency(raw.calculation.nettoEfterAvgifter)}`,
                    `Ca ${formatCurrency(raw.calculation.monthlyNet)}/månad`,
                ].join('\n'),
            }
        } catch (error) {
            console.error('[calculate_egenavgifter_ytd]', error)
            return { success: false, error: `Kunde inte beräkna egenavgifter: ${error instanceof Error ? error.message : 'okänt fel'}` }
        }
    },
})

export const taxCalculationTools = [calculateEgenavgifterTool]
