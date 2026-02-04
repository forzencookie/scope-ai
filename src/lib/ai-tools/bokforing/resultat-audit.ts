/**
 * Bokföring AI Tools - Income Statement Audit
 *
 * Comprehensive resultatkontroll that analyzes the income statement
 * and compares key metrics like a Swedish accountant would.
 */

import { defineTool } from '../registry'
import { db } from '../../database/server-db'
import { getSupabaseAdmin } from '../../database/supabase'
import type { AuditCheck, AuditResult } from './audit'

// =============================================================================
// Income Statement Audit Tool
// =============================================================================

export const runIncomeStatementAuditTool = defineTool<Record<string, never>, AuditResult>({
    name: 'run_income_statement_audit',
    description: 'Kör en komplett resultatkontroll som analyserar intäkter, kostnader, bruttovinst, personalkostnader, avskrivningar och periodresultat. Jämför med tidigare perioder och identifierar avvikelser som en revisor.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const year = new Date().getFullYear()
        const prevYear = year - 1
        const dateFrom = `${year}-01-01`
        const dateTo = `${year}-12-31`
        const prevDateFrom = `${prevYear}-01-01`
        const prevDateTo = `${prevYear}-12-31`
        const supabase = getSupabaseAdmin()

        // Gather all data in parallel
        const [
            currentBalances,
            prevBalances,
            payslips,
        ] = await Promise.all([
            supabase.rpc('get_account_balances', {
                date_from: dateFrom,
                date_to: dateTo,
            }),
            supabase.rpc('get_account_balances', {
                date_from: prevDateFrom,
                date_to: prevDateTo,
            }),
            db.getPayslips(500),
        ])

        const balances: Array<{ account: string; balance: number }> = currentBalances.data || []
        const prevBalanceList: Array<{ account: string; balance: number }> = prevBalances.data || []

        // Build account balance lookup
        const accountBalance = (start: number, end: number): number => {
            return balances
                .filter(b => {
                    const acc = parseInt(b.account)
                    return acc >= start && acc <= end
                })
                .reduce((sum, b) => sum + b.balance, 0)
        }

        const prevAccountBalance = (start: number, end: number): number => {
            return prevBalanceList
                .filter(b => {
                    const acc = parseInt(b.account)
                    return acc >= start && acc <= end
                })
                .reduce((sum, b) => sum + b.balance, 0)
        }

        const hasAccountsInRange = (start: number, end: number): boolean => {
            return balances.some(b => {
                const acc = parseInt(b.account)
                return acc >= start && acc <= end && Math.abs(b.balance) > 0.01
            })
        }

        const checks: AuditCheck[] = []

        // =====================================================================
        // 1. Intäkter — Revenue accounts should have credit balance
        // =====================================================================
        {
            const revenue = accountBalance(3000, 3999)

            if (revenue >= 0) {
                checks.push({
                    name: 'Intäkter',
                    status: 'pass',
                    description: 'Intäkter har normalt saldo',
                    details: `Totala intäkter: ${Math.abs(revenue).toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Intäkter',
                    status: 'warning',
                    description: 'Intäkter har negativt saldo (ovanligt)',
                    details: `Saldo: ${revenue.toLocaleString('sv-SE')} kr. Kontrollera kreditnotor eller felbokningar.`,
                })
            }
        }

        // =====================================================================
        // 2. Bruttovinst — Gross profit margin check
        // =====================================================================
        {
            const revenue = Math.abs(accountBalance(3000, 3999))
            const cogs = accountBalance(4000, 4999) // Varuinköp/direkta kostnader

            if (revenue > 0) {
                const grossProfit = revenue - cogs
                const grossMargin = (grossProfit / revenue) * 100

                if (grossMargin >= 20) {
                    checks.push({
                        name: 'Bruttovinst',
                        status: 'pass',
                        description: `Bruttomarginal ${grossMargin.toFixed(1)}%`,
                        details: `Intäkter: ${revenue.toLocaleString('sv-SE')} kr, Varuinköp: ${cogs.toLocaleString('sv-SE')} kr`,
                    })
                } else if (grossMargin >= 0) {
                    checks.push({
                        name: 'Bruttovinst',
                        status: 'warning',
                        description: `Låg bruttomarginal ${grossMargin.toFixed(1)}%`,
                        details: `Intäkter: ${revenue.toLocaleString('sv-SE')} kr, Varuinköp: ${cogs.toLocaleString('sv-SE')} kr`,
                    })
                } else {
                    checks.push({
                        name: 'Bruttovinst',
                        status: 'fail',
                        description: `Negativ bruttomarginal ${grossMargin.toFixed(1)}%`,
                        details: `Varuinköp överstiger intäkter. Kontrollera bokförda transaktioner.`,
                    })
                }
            } else {
                checks.push({
                    name: 'Bruttovinst',
                    status: 'pass',
                    description: 'Inga intäkter att jämföra',
                })
            }
        }

        // =====================================================================
        // 3. Personalkostnader — Personnel costs ratio
        // =====================================================================
        {
            const revenue = Math.abs(accountBalance(3000, 3999))
            const personnelCosts = accountBalance(7000, 7699) // Löner + sociala avgifter
            const payslipList = payslips || []

            if (revenue > 0 && personnelCosts > 0) {
                const ratio = (personnelCosts / revenue) * 100

                if (ratio <= 60) {
                    checks.push({
                        name: 'Personalkostnader',
                        status: 'pass',
                        description: `${ratio.toFixed(1)}% av omsättningen`,
                        details: `Personal: ${personnelCosts.toLocaleString('sv-SE')} kr, ${payslipList.length} lönebesked`,
                    })
                } else {
                    checks.push({
                        name: 'Personalkostnader',
                        status: 'warning',
                        description: `Hög personalkostnad: ${ratio.toFixed(1)}% av omsättningen`,
                        details: `Personal: ${personnelCosts.toLocaleString('sv-SE')} kr. Branschsnitt ~40-50%.`,
                    })
                }
            } else if (personnelCosts > 0) {
                checks.push({
                    name: 'Personalkostnader',
                    status: 'pass',
                    description: 'Personalkostnader bokförda',
                    details: `Total: ${personnelCosts.toLocaleString('sv-SE')} kr, ${payslipList.length} lönebesked`,
                })
            } else {
                checks.push({
                    name: 'Personalkostnader',
                    status: 'pass',
                    description: 'Inga personalkostnader',
                })
            }
        }

        // =====================================================================
        // 4. Avskrivningar — Depreciation for fixed assets
        // =====================================================================
        {
            const hasFixedAssets = hasAccountsInRange(1200, 1299)
            const depreciation = accountBalance(7800, 7899)

            if (hasFixedAssets && depreciation === 0) {
                checks.push({
                    name: 'Avskrivningar',
                    status: 'fail',
                    description: `Anläggningstillgångar finns men avskrivningar saknas för ${year}`,
                    details: 'Konton 1200-1299 har saldon men inga avskrivningar på 7800-7899.',
                })
            } else if (hasFixedAssets && depreciation > 0) {
                checks.push({
                    name: 'Avskrivningar',
                    status: 'pass',
                    description: 'Avskrivningar bokförda',
                    details: `Avskrivningar: ${depreciation.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Avskrivningar',
                    status: 'pass',
                    description: 'Inga anläggningstillgångar att skriva av',
                })
            }
        }

        // =====================================================================
        // 5. Resultatjämförelse — Compare vs previous period
        // =====================================================================
        {
            const currentRevenue = Math.abs(accountBalance(3000, 3999))
            const prevRevenue = Math.abs(prevAccountBalance(3000, 3999))
            const currentCosts = accountBalance(4000, 8999)
            const prevCosts = prevAccountBalance(4000, 8999)

            const currentResult = currentRevenue - currentCosts
            const prevResult = prevRevenue - prevCosts

            if (prevRevenue > 0) {
                const revenueChange = ((currentRevenue - prevRevenue) / prevRevenue) * 100
                const resultChange = prevResult !== 0 ? ((currentResult - prevResult) / Math.abs(prevResult)) * 100 : 0

                if (currentResult >= prevResult) {
                    checks.push({
                        name: 'Resultatutveckling',
                        status: 'pass',
                        description: `Resultat ${resultChange >= 0 ? '+' : ''}${resultChange.toFixed(0)}% vs förra året`,
                        details: `${year}: ${currentResult.toLocaleString('sv-SE')} kr, ${prevYear}: ${prevResult.toLocaleString('sv-SE')} kr`,
                    })
                } else if (resultChange > -20) {
                    checks.push({
                        name: 'Resultatutveckling',
                        status: 'warning',
                        description: `Resultat ${resultChange.toFixed(0)}% vs förra året`,
                        details: `${year}: ${currentResult.toLocaleString('sv-SE')} kr, ${prevYear}: ${prevResult.toLocaleString('sv-SE')} kr`,
                    })
                } else {
                    checks.push({
                        name: 'Resultatutveckling',
                        status: 'fail',
                        description: `Kraftig resultatnedgång: ${resultChange.toFixed(0)}%`,
                        details: `${year}: ${currentResult.toLocaleString('sv-SE')} kr, ${prevYear}: ${prevResult.toLocaleString('sv-SE')} kr`,
                    })
                }
            } else {
                checks.push({
                    name: 'Resultatutveckling',
                    status: 'pass',
                    description: 'Första verksamhetsåret',
                    details: `Årets resultat: ${currentResult.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 6. Periodiseringar — Accrued/prepaid at period end
        // =====================================================================
        {
            const upplysen = hasAccountsInRange(3700, 3799) // Upplupna intäkter
            const forutbetald = hasAccountsInRange(1700, 1799) // Förutbetalda kostnader
            const upplupen = hasAccountsInRange(2900, 2999) // Upplupna kostnader

            const now = new Date()
            const isYearEnd = now.getMonth() >= 10 // Nov-Dec

            if (isYearEnd && !forutbetald && !upplupen && !upplysen) {
                checks.push({
                    name: 'Periodiseringar',
                    status: 'warning',
                    description: 'Inga periodiseringar bokförda nära årsskifte',
                    details: 'Kontrollera om förutbetalda kostnader (1700), upplupna kostnader (2900) eller upplupna intäkter (3700) behöver bokföras.',
                })
            } else {
                checks.push({
                    name: 'Periodiseringar',
                    status: 'pass',
                    description: (forutbetald || upplupen || upplysen)
                        ? 'Periodiseringar finns bokförda'
                        : 'Inga periodiseringar krävs för perioden',
                })
            }
        }

        // Build summary
        const summary = {
            total: checks.length,
            passed: checks.filter(c => c.status === 'pass').length,
            warnings: checks.filter(c => c.status === 'warning').length,
            failed: checks.filter(c => c.status === 'fail').length,
        }

        const result: AuditResult = {
            date: new Date().toISOString().split('T')[0],
            fiscalYear: year,
            checks,
            summary,
        }

        // Build message for AI
        const statusEmoji = summary.failed > 0 ? '❌' : summary.warnings > 0 ? '⚠️' : '✅'
        const checkDetails = checks.map(c => {
            const icon = c.status === 'pass' ? '✅' : c.status === 'warning' ? '⚠️' : '❌'
            return `${icon} **${c.name}**: ${c.description}` + (c.details ? `\n   ${c.details}` : '')
        }).join('\n\n')

        const message = `${statusEmoji} Resultatkontroll klar: ${summary.passed}/${summary.total} godkända` +
            (summary.warnings > 0 ? `, ${summary.warnings} varningar` : '') +
            (summary.failed > 0 ? `, ${summary.failed} fel` : '') +
            '.\n\n' + checkDetails +
            '\n\n---\n\n' +
            'Resultatet visas i en walkthrough-vy för användaren. Skriv en kort kommentar (2-4 meningar) som en revisor skulle göra: ' +
            'beskriv din tankeprocess, vad du har analyserat, om något väckte din uppmärksamhet, och om det finns något användaren bör agera på. ' +
            'Skriv i första person, direkt till användaren. Skriv INTE ut kontrollerna igen — de visas redan i vyn.'

        return {
            success: true,
            data: {
                ...result,
                walkthrough: {
                    title: 'Resultatkontroll',
                    summary: `${summary.passed}/${summary.total} godkända` +
                        (summary.warnings > 0 ? `, ${summary.warnings} varningar` : '') +
                        (summary.failed > 0 ? `, ${summary.failed} fel` : ''),
                    date: result.date,
                    sections: checks.map(c => ({
                        heading: c.name,
                        status: c.status,
                        description: c.description,
                        details: c.details,
                    })),
                },
            },
            message,
        }
    },
})

export const resultatAuditTools = [runIncomeStatementAuditTool]
