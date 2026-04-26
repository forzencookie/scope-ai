import { defineTool } from '../registry'
import { INK2SRUProcessor } from '@/services/processors/tax'
import type { CompanyInfo, INK2CalculationResult } from '@/services/processors/tax'
import type { Verification as ProcessorVerification } from '@/types/verification'
import { verificationService } from '@/services/accounting'
import type { Verification } from '@/types'
import type { TaxPeriod } from '@/types/sru'
import { formatCurrency } from '@/lib/utils'

function toProcessorVerifications(verifications: Verification[]): ProcessorVerification[] {
    return verifications.map(v => ({
        id: v.id,
        series: v.series,
        number: v.number,
        date: v.date,
        description: v.description,
        rows: v.entries.map(e => ({
            account: e.account,
            description: e.description ?? '',
            debit: e.debit,
            credit: e.credit,
        })),
        sourceType: v.sourceType,
        sourceId: v.sourceId,
    }))
}

export interface CalculateINK2Params {
    year?: number
}

export const calculateINK2Tool = defineTool<CalculateINK2Params, INK2CalculationResult['summary']>({
    name: 'calculate_ink2_summary',
    description: 'Beräkna INK2-underlag (inkomstdeklaration för aktiebolag) direkt från bokföringen. Ger resultaträkning, balansräkning och skattemässigt resultat. Använd när användaren frågar om bolagets skatteunderlag, INK2 eller inkomstdeklaration.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: ['ab'],
    keywords: ['INK2', 'inkomstdeklaration', 'skatteunderlag', 'skatt', 'deklaration', 'aktiebolag', 'bokslut', 'balansräkning', 'resultaträkning'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Beskattningsår (standard: innevarande år)' },
        },
    },
    execute: async (params, context) => {
        const year = params.year ?? new Date().getFullYear()
        const taxPeriod: TaxPeriod = `${year}P4`

        try {
            if (!context.supabase) {
                return { success: false, error: 'Ingen databasanslutning tillgänglig.' }
            }

            const { data: company, error: companyError } = await context.supabase
                .from('companies')
                .select('name, org_number, fiscal_year_end')
                .single()

            if (companyError || !company) {
                return { success: false, error: 'Kunde inte hämta företagsinformation.' }
            }

            // Derive fiscal year dates from stored fiscal_year_end or default to calendar year
            const fiscalYearEnd = company.fiscal_year_end
                ? new Date(company.fiscal_year_end)
                : new Date(`${year}-12-31`)
            const fiscalYearStart = new Date(fiscalYearEnd)
            fiscalYearStart.setFullYear(fiscalYearStart.getFullYear() - 1)
            fiscalYearStart.setDate(fiscalYearStart.getDate() + 1)

            const companyInfo: CompanyInfo = {
                orgnr: company.org_number ?? '',
                name: company.name,
                fiscalYearStart,
                fiscalYearEnd,
            }

            const { verifications } = await verificationService.getVerifications(
                { year, limit: 5000 },
                context.supabase,
            )

            if (verifications.length === 0) {
                return {
                    success: true,
                    data: { totalAssets: 0, totalEquityAndLiabilities: 0, revenue: 0, expenses: 0, profit: 0, taxableIncome: 0 },
                    message: `Inga verifikationer hittades för ${year}. Kan inte beräkna INK2-underlag.`,
                }
            }

            const { summary } = INK2SRUProcessor.calculateAll(toProcessorVerifications(verifications), companyInfo, taxPeriod)

            const resultLine = summary.taxableIncome >= 0
                ? `Överskott: **${formatCurrency(summary.taxableIncome)}**`
                : `Underskott: **${formatCurrency(Math.abs(summary.taxableIncome))}**`

            return {
                success: true,
                data: summary,
                message: [
                    `📊 **INK2-underlag ${year}** (${verifications.length} verifikationer)`,
                    ``,
                    `Intäkter: ${formatCurrency(summary.revenue)}`,
                    `Kostnader: ${formatCurrency(summary.expenses)}`,
                    `Resultat: ${formatCurrency(summary.profit)}`,
                    ``,
                    resultLine,
                    ``,
                    `Tillgångar: ${formatCurrency(summary.totalAssets)}`,
                    `Eget kapital & skulder: ${formatCurrency(summary.totalEquityAndLiabilities)}`,
                ].join('\n'),
            }
        } catch (error) {
            console.error('[calculate_ink2_summary]', error)
            return {
                success: false,
                error: `Kunde inte beräkna INK2-underlag: ${error instanceof Error ? error.message : 'okänt fel'}`,
            }
        }
    },
})

export const ink2Tools = [calculateINK2Tool]
