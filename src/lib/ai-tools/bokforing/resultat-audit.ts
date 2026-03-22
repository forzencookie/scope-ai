/**
 * Bokföring AI Tools - Income Statement Audit
 *
 * Comprehensive resultatkontroll that analyzes the income statement
 * and compares key metrics like a Swedish accountant would.
 */

import { defineTool } from '../registry'
import { accountService } from '@/services/accounting/account-service'
import type { IncomeAudit } from '@/lib/ai-schema'

// =============================================================================
// Income Statement Audit Tool
// =============================================================================

export const runIncomeStatementAuditTool = defineTool<Record<string, never>, IncomeAudit>({
    name: 'run_income_statement_audit',
    description: 'Kör en komplett resultatkontroll som analyserar intäkter, kostnader, bruttovinst, personalkostnader, avskrivningar och periodresultat. Jämför med tidigare perioder och identifierar avvikelser som en revisor.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['revision', 'resultaträkning', 'granskning'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const year = new Date().getFullYear()
        const prevYear = year - 1
        const dateFrom = `${year}-01-01`
        const dateTo = `${year}-12-31`
        const prevDateFrom = `${prevYear}-01-01`
        const prevDateTo = `${prevYear}-12-31`

        // Gather all data using service layer
        const [
            rawBalances,
            _customerInvoices,
            _supplierInvoices,
            payslips,
            _shareholders,
            _taxReports,
        ] = await accountService.getAuditData(dateFrom, dateTo)

        // Fetch previous year balances separately
        const prevYearBalances = await accountService.getAccountBalances(prevDateFrom, prevDateTo)

        const balances = rawBalances.map(b => ({ account: b.accountNumber, balance: b.balance }))
        const prevBalances = prevYearBalances.map(b => ({ account: b.accountNumber, balance: b.balance }))

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
            return prevBalances
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

        const issues: Array<{ id: string; type: 'pass' | 'warning' | 'error' | 'info'; title: string; description: string; details?: string }> = []
        const metrics: Record<string, number> = {}

        // =====================================================================
        // 1. Intäkter
        // =====================================================================
        {
            const revenue = accountBalance(3000, 3999)
            metrics.revenue = Math.abs(revenue)

            if (revenue < 0) {
                issues.push({
                    id: 'intakter',
                    type: 'warning',
                    title: 'Intäkter',
                    description: 'Intäkter har negativt saldo (ovanligt)',
                    details: `Saldo: ${revenue.toLocaleString('sv-SE')} kr. Kontrollera kreditnotor eller felbokningar.`,
                })
            }
        }

        // =====================================================================
        // 2. Bruttovinst
        // =====================================================================
        {
            const revenue = Math.abs(accountBalance(3000, 3999))
            const cogs = accountBalance(4000, 4999)

            if (revenue > 0) {
                const grossProfit = revenue - cogs
                const grossMargin = (grossProfit / revenue) * 100
                metrics.grossMargin = grossMargin

                if (grossMargin < 0) {
                    issues.push({
                        id: 'bruttovinst',
                        type: 'error',
                        title: 'Bruttovinst',
                        description: `Negativ bruttomarginal ${grossMargin.toFixed(1)}%`,
                        details: `Varuinköp överstiger intäkter. Kontrollera bokförda transaktioner.`,
                    })
                } else if (grossMargin < 20) {
                    issues.push({
                        id: 'bruttovinst',
                        type: 'warning',
                        title: 'Bruttovinst',
                        description: `Låg bruttomarginal ${grossMargin.toFixed(1)}%`,
                        details: `Intäkter: ${revenue.toLocaleString('sv-SE')} kr, Varuinköp: ${cogs.toLocaleString('sv-SE')} kr`,
                    })
                }
            }
        }

        // =====================================================================
        // 3. Personalkostnader
        // =====================================================================
        {
            const revenue = Math.abs(accountBalance(3000, 3999))
            const personnelCosts = accountBalance(7000, 7699)
            metrics.personnelRatio = revenue > 0 ? (personnelCosts / revenue) * 100 : 0

            if (revenue > 0 && metrics.personnelRatio > 60) {
                issues.push({
                    id: 'personal',
                    type: 'warning',
                    title: 'Personalkostnader',
                    description: `Hög personalkostnad: ${metrics.personnelRatio.toFixed(1)}% av omsättningen`,
                    details: `Personal: ${personnelCosts.toLocaleString('sv-SE')} kr. Branschsnitt ~40-50%.`,
                })
            }
        }

        // =====================================================================
        // 4. Avskrivningar
        // =====================================================================
        {
            const hasFixedAssets = hasAccountsInRange(1200, 1299)
            const depreciation = accountBalance(7800, 7899)

            if (hasFixedAssets && depreciation === 0) {
                issues.push({
                    id: 'avskrivningar',
                    type: 'error',
                    title: 'Avskrivningar',
                    description: `Anläggningstillgångar finns men avskrivningar saknas för ${year}`,
                    details: 'Konton 1200-1299 har saldon men inga avskrivningar på 7800-7899.',
                })
            }
        }

        // =====================================================================
        // 5. Resultatjämförelse
        // =====================================================================
        {
            const currentRevenue = Math.abs(accountBalance(3000, 3999))
            const prevRevenue = Math.abs(prevAccountBalance(3000, 3999))
            const currentCosts = accountBalance(4000, 8999)
            const prevCosts = prevAccountBalance(4000, 8999)

            const currentResult = currentRevenue - currentCosts
            const prevResult = prevRevenue - prevCosts

            if (prevRevenue > 0) {
                const resultChange = prevResult !== 0 ? ((currentResult - prevResult) / Math.abs(prevResult)) * 100 : 0
                metrics.resultChange = resultChange

                if (resultChange < -20) {
                    issues.push({
                        id: 'utveckling',
                        type: resultChange < -50 ? 'error' : 'warning',
                        title: 'Resultatutveckling',
                        description: `Kraftig resultatnedgång: ${resultChange.toFixed(0)}%`,
                        details: `${year}: ${currentResult.toLocaleString('sv-SE')} kr, ${prevYear}: ${prevResult.toLocaleString('sv-SE')} kr`,
                    })
                }
            }
        }

        const summaryCount = {
            total: issues.length + 5, // Total checks including passed ones
            passed: 5, // Simplified logic for passed checks
            warnings: issues.filter(i => i.type === 'warning').length,
            failed: issues.filter(i => i.type === 'error').length,
        }

        const result: IncomeAudit = {
            timestamp: new Date().toISOString(),
            period: `${year}-01-01 till ${year}-12-31`,
            issues: issues.map(i => ({
                id: i.id,
                type: i.type as 'warning' | 'error' | 'info',
                title: i.title,
                description: i.description,
                details: i.details
            })),
            summary: `Resultatkontroll klar: ${summaryCount.warnings} varningar, ${summaryCount.failed} fel identifierade.`,
            metrics,
        }

        const statusEmoji = summaryCount.failed > 0 ? '❌' : summaryCount.warnings > 0 ? '⚠️' : '✅'

        return {
            success: true,
            data: result,
            message: `${statusEmoji} ${result.summary}\n\nSkriv en kort kommentar som revisor till användaren baserat på analysen.`,
        }
    },
})

export const resultatAuditTools = [runIncomeStatementAuditTool]
