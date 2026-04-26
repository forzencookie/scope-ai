import { defineTool } from '../registry'
import { periodClosingService, type MonthlySummary } from '@/services/accounting'
import { formatCurrency } from '@/lib/utils'

export interface GetPeriodSummariesParams {
    year?: number
    fiscalYearEnd?: string
}

export const getPeriodSummariesTool = defineTool<GetPeriodSummariesParams, MonthlySummary[]>({
    name: 'get_period_summaries',
    description: 'Hämta månadsöversikt med resultat, status (öppen/stängd) och verifikationsantal per månad. Visa när användaren frågar om månadsavslut eller vill se hur det gått per månad.',
    category: 'read',
    domain: 'bokforing',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    keywords: ['månadsavslut', 'period', 'månadsöversikt', 'stängd', 'öppen', 'avslut', 'månadsvis'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'År (standard: innevarande)' },
            fiscalYearEnd: { type: 'string', description: 'Räkenskapsår slut som MM-DD (standard: 12-31)' },
        },
    },
    execute: async (params, context) => {
        if (!context.supabase) {
            return { success: false, error: 'Ingen databasanslutning tillgänglig.' }
        }
        try {
            const year = params.year ?? new Date().getFullYear()
            const fiscalYearEnd = params.fiscalYearEnd ?? '12-31'
            const { summaries } = await periodClosingService.getMonthlySummaries(fiscalYearEnd, year, context.supabase)

            if (summaries.length === 0) {
                return { success: true, data: [], message: 'Inga månadsdata hittades.' }
            }

            const closed = summaries.filter(s => s.status === 'closed').length
            const lines = summaries.map(s =>
                `${s.status === 'closed' ? '🔒' : '🟢'} **${s.label}** — ${formatCurrency(s.result)} | ${s.verificationCount} ver. | ${s.status === 'closed' ? 'Stängd' : 'Öppen'}`
            )

            return {
                success: true,
                data: summaries,
                message: [
                    `📅 **Månadsöversikt ${year}** (${closed}/${summaries.length} stängda)`,
                    ``,
                    lines.join('\n'),
                ].join('\n'),
            }
        } catch (error) {
            console.error('[get_period_summaries]', error)
            return { success: false, error: 'Kunde inte hämta månadsöversikt.' }
        }
    },
})

export interface TogglePeriodParams {
    year: number
    month: number
    action: 'close' | 'reopen'
}

export const togglePeriodStatusTool = defineTool<TogglePeriodParams, { message: string; affectedCount: number }>({
    name: 'toggle_period_status',
    description: 'Stäng eller öppna en bokföringsperiod (månad). Stängda perioder kan inte bokföras mot. Kräver bekräftelse.',
    category: 'write',
    domain: 'bokforing',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    keywords: ['stäng period', 'öppna period', 'månadsavslut', 'lås period'],
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'År (t.ex. 2024)' },
            month: { type: 'number', description: 'Månad 1-12' },
            action: { type: 'string', enum: ['close', 'reopen'], description: 'close = stäng, reopen = öppna igen' },
        },
        required: ['year', 'month', 'action'],
    },
    execute: async (params, context) => {
        const periodLabel = `${params.year}-${String(params.month).padStart(2, '0')}`

        if (!context.isConfirmed) {
            return {
                success: true,
                confirmationRequired: {
                    id: crypto.randomUUID(),
                    type: 'toggle_period_status',
                    title: `${params.action === 'close' ? 'Stäng' : 'Öppna'} period ${periodLabel}`,
                    description: params.action === 'close'
                        ? 'Inga fler verifikationer kan bokföras mot denna period efter att den stängts.'
                        : 'Verifikationer kan bokföras mot perioden igen.',
                    summary: [
                        { label: 'Period', value: periodLabel },
                        { label: 'Åtgärd', value: params.action === 'close' ? 'Stäng' : 'Öppna' },
                    ],
                    action: { toolName: 'toggle_period_status', params },
                },
            }
        }

        if (!context.supabase) {
            return { success: false, error: 'Ingen databasanslutning tillgänglig.' }
        }

        try {
            const result = await periodClosingService.toggleMonthStatus(
                {
                    year: params.year,
                    month: params.month,
                    action: params.action,
                    companyId: context.companyId ?? '',
                    userId: context.userId,
                },
                context.supabase,
            )
            return {
                success: true,
                data: result,
                message: `✅ Period ${periodLabel} är nu ${params.action === 'close' ? 'stängd' : 'öppen'}. ${result.affectedCount} verifikationer påverkades.`,
            }
        } catch (error) {
            console.error('[toggle_period_status]', error)
            return { success: false, error: `Kunde inte ändra periodstatus: ${error instanceof Error ? error.message : 'okänt fel'}` }
        }
    },
})

export const periodTools = [getPeriodSummariesTool, togglePeriodStatusTool]
