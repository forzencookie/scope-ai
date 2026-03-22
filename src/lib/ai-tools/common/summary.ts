/**
 * Summary AI Tools - /dag, /vecka, /månad
 * 
 * Provides deterministic summaries of business performance.
 * Interconnectivity: Combines Bookkeeping (ledger) and Activity Log (actions).
 */

import { defineTool } from '../registry'
import { verificationService } from '@/services/accounting/verification-service'
import { activityService } from '@/services/common/activity-service'
import { formatCurrency } from '@/lib/utils'

export interface SummaryParams {
    period: 'day' | 'week' | 'month'
}

export interface SummaryResult {
    period: string
    revenue: number
    expenses: number
    netResult: number
    verificationCount: number
    activityCount: number
    highlights: string[]
}

export const getSummaryTool = defineTool<SummaryParams, SummaryResult>({
    name: 'get_business_summary',
    description: 'Ger en sammanfattning av hur det går för företaget under en viss period (dag, vecka eller månad). Visar resultat och viktiga händelser.',
    category: 'read',
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['sammanfattning', 'status', 'hur går det', 'rapport'],
    parameters: {
        type: 'object',
        properties: {
            period: { 
                type: 'string', 
                enum: ['day', 'week', 'month'], 
                description: 'Perioden du vill ha sammanfattning för' 
            },
        },
        required: ['period'],
    },
    execute: async (params, context) => {
        const now = new Date()
        let startDate = new Date()
        
        if (params.period === 'day') {
            startDate.setHours(0, 0, 0, 0)
        } else if (params.period === 'week') {
            startDate.setDate(now.getDate() - 7)
        } else if (params.period === 'month') {
            startDate.setMonth(now.getMonth() - 1)
        }

        const startDateStr = startDate.toISOString().split('T')[0]
        const companyId = context.companyId || ''

        // 1. Fetch verifications for financial summary
        const { verifications } = await verificationService.getVerifications({
            startDate: startDateStr,
            limit: 1000
        })

        // 2. Fetch activities for action summary
        const { activities } = await activityService.getActivities({
            companyId,
            dateFilter: params.period === 'day' ? now : null,
            limit: 50
        })

        // 3. Calculate financial totals
        let revenue = 0
        let expenses = 0

        verifications.forEach(v => {
            v.entries.forEach(e => {
                const acc = e.account
                // Swedish BAS: Class 3 is Revenue
                if (acc.startsWith('3')) {
                    revenue += (e.credit - e.debit)
                }
                // Swedish BAS: Class 4-8 is Expenses
                if (acc.startsWith('4') || acc.startsWith('5') || acc.startsWith('6') || acc.startsWith('7') || acc.startsWith('8')) {
                    expenses += (e.debit - e.credit)
                }
            })
        })

        const highlights: string[] = []
        if (activities.length > 0) {
            const latest = activities[0]
            highlights.push(`${latest.userName} ${latest.action} ${latest.entityName}`)
        }

        const periodLabel = params.period === 'day' ? 'idag' : params.period === 'week' ? 'senaste veckan' : 'senaste månaden'

        return {
            success: true,
            data: {
                period: periodLabel,
                revenue,
                expenses,
                netResult: revenue - expenses,
                verificationCount: verifications.length,
                activityCount: activities.length,
                highlights
            },
            message: `Här är en sammanfattning för ${periodLabel}: Resultatet är ${formatCurrency(revenue - expenses)}. Vi har registrerat ${verifications.length} verifikationer.`
        }
    }
})

export const summaryTools = [getSummaryTool]
