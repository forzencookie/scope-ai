import { defineTool } from '../registry'
import { VatCalculator } from '@/services/processors/vat'
import type { VatReport } from '@/services/processors/vat'
import type { Verification as ProcessorVerification } from '@/types/verification'
import { verificationService } from '@/services/accounting'
import type { Verification } from '@/types'
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

export interface CalculateVatFromLedgerParams {
    period?: string
}

export const calculateVatFromLedgerTool = defineTool<CalculateVatFromLedgerParams, Pick<VatReport, 'ruta10' | 'ruta11' | 'ruta12' | 'ruta48' | 'ruta49' | 'salesVat' | 'inputVat' | 'netVat'>>({
    name: 'calculate_vat_from_ledger',
    description: 'Beräkna momsdeklaration direkt från bokföringen (alla 33 momsrutor). Mer exakt än historiska poster. Använd när användaren vill se momsunderlaget från sina verifikationer eller förbereda en momsdeklaration.',
    category: 'read',
    domain: 'skatt',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['moms', 'momsdeklaration', 'beräkna moms', 'VAT', 'bokföring', 'verifikationer', 'momsunderlag', 'momsrapport'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "Q4 2024", "Q1 2025"). Standard: innevarande kvartal.' },
        },
    },
    execute: async (params, context) => {
        const now = new Date()
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
        const period = params.period ?? `Q${currentQuarter} ${now.getFullYear()}`

        const yearMatch = period.match(/\d{4}/)
        const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear()

        try {
            const { verifications } = await verificationService.getVerifications(
                { year, limit: 5000 },
                context.supabase,
            )

            if (verifications.length === 0) {
                return {
                    success: true,
                    data: { ruta10: 0, ruta11: 0, ruta12: 0, ruta48: 0, ruta49: 0, salesVat: 0, inputVat: 0, netVat: 0 },
                    message: `Inga verifikationer hittades för ${period}. Kan inte beräkna moms.`,
                }
            }

            const report = VatCalculator.calculateFromRealVerifications(toProcessorVerifications(verifications), period)

            const action = report.netVat > 0 ? 'betala' : 'få tillbaka'

            return {
                success: true,
                data: {
                    ruta10: report.ruta10,
                    ruta11: report.ruta11,
                    ruta12: report.ruta12,
                    ruta48: report.ruta48,
                    ruta49: report.ruta49,
                    salesVat: report.salesVat,
                    inputVat: report.inputVat,
                    netVat: report.netVat,
                },
                message: [
                    `📊 **Momsberäkning ${period}** (${verifications.length} verifikationer)`,
                    ``,
                    `Utgående moms 25%: ${formatCurrency(report.ruta10)}`,
                    `Utgående moms 12%: ${formatCurrency(report.ruta11)}`,
                    `Utgående moms 6%: ${formatCurrency(report.ruta12)}`,
                    `Ingående moms (avdragsgill): ${formatCurrency(report.ruta48)}`,
                    ``,
                    `**Att ${action}: ${formatCurrency(Math.abs(report.netVat))}**`,
                    `Förfallodatum: ${report.dueDate}`,
                ].join('\n'),
            }
        } catch (error) {
            console.error('[calculate_vat_from_ledger]', error)
            return {
                success: false,
                error: `Kunde inte beräkna moms: ${error instanceof Error ? error.message : 'okänt fel'}`,
            }
        }
    },
})

export const vatCalculatorTools = [calculateVatFromLedgerTool]
