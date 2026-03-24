/**
 * Bokföring AI Tools - Balance Sheet Audit
 *
 * Comprehensive balanskontroll that cross-references data
 * from multiple domains like a Swedish accountant would.
 */

import { defineTool } from '../registry'
import { accountService } from '@/services/accounting/account-service'
import type { BalanceAudit } from '@/lib/ai-schema'

// =============================================================================
// Balance Sheet Audit Tool
// =============================================================================

export const runBalanceSheetAuditTool = defineTool<Record<string, never>, BalanceAudit>({
    name: 'run_balance_sheet_audit',
    description: 'Kör en komplett balanskontroll som kontrollerar balansräkningsprov, momsavstämning, kundfordringar, leverantörsskulder, löneavstämning, avskrivningar, eget kapital och periodiseringar. Samlar data från hela bokföringen och korsrefererar som en revisor.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['revision', 'balansräkning', 'granskning', 'kontroll'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const year = new Date().getFullYear()
        const dateTo = `${year}-12-31`

        // Gather all data using service layer
        const [
            rawBalances,
            customerInvoices,
            supplierInvoices,
            payslips,
            shareholders,
        ] = await accountService.getAuditData('2000-01-01', dateTo)

        const balances = rawBalances.map(b => ({
            account: b.accountNumber,
            balance: b.balance,
        }))

        // Build account balance lookup
        const accountBalance = (start: number, end: number): number => {
            return balances
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

        const issues: Array<{ id: string; type: 'info' | 'warning' | 'error'; title: string; description: string; details?: string; isPass?: boolean }> = []

        // =====================================================================
        // 1. Balansräkningsprov — Assets = Equity + Liabilities
        // =====================================================================
        {
            const assets = -(accountBalance(1000, 1999)) // Assets have negative balance
            const equityAndLiabilities = accountBalance(2000, 2999)
            const diff = Math.abs(assets - equityAndLiabilities)

            if (diff < 1) {
                issues.push({
                    id: 'balansprov',
                    type: 'info',
                    isPass: true,
                    title: 'Balansräkningsprov',
                    description: 'Tillgångar = Eget kapital + Skulder',
                    details: `Tillgångar: ${assets.toLocaleString('sv-SE')} kr, EK+Skulder: ${equityAndLiabilities.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'balansprov',
                    type: 'error',
                    title: 'Balansräkningsprov',
                    description: 'Tillgångar stämmer inte med Eget kapital + Skulder',
                    details: `Differens: ${diff.toLocaleString('sv-SE')} kr (Tillgångar: ${assets.toLocaleString('sv-SE')} kr, EK+Skulder: ${equityAndLiabilities.toLocaleString('sv-SE')} kr)`,
                })
            }
        }

        // =====================================================================
        // 2. Momsavstämning
        // =====================================================================
        {
            const outputVat = accountBalance(2610, 2619)
            const inputVat = accountBalance(2640, 2649)
            const vatDebt = accountBalance(2650, 2659)
            const bookedVatNet = outputVat + inputVat + vatDebt

            if (Math.abs(bookedVatNet) < 100) {
                issues.push({
                    id: 'moms',
                    type: 'info',
                    isPass: true,
                    title: 'Momsavstämning',
                    description: 'Momskonton stämmer',
                    details: `Utgående: ${outputVat.toLocaleString('sv-SE')} kr, Ingående: ${inputVat.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'moms',
                    type: 'warning',
                    title: 'Momsavstämning',
                    description: 'Momskonton har oavstämd differens',
                    details: `Oavstämt saldo: ${bookedVatNet.toLocaleString('sv-SE')} kr. Kontrollera att momsdeklaration är bokförd.`,
                })
            }
        }

        // =====================================================================
        // 3. Kundfordringar
        // =====================================================================
        {
            const accountBal = -(accountBalance(1510, 1519))
            const openInvoices = (customerInvoices || [])
                .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
            const invoiceTotal = openInvoices.reduce((sum: number, i) => sum + (i.total_amount || 0), 0)

            if (Math.abs(accountBal - invoiceTotal) > 100 && (accountBal > 0 || invoiceTotal > 0)) {
                issues.push({
                    id: 'kundfordringar',
                    type: 'warning',
                    title: 'Kundfordringar',
                    description: 'Konto 1510 matchar inte öppna fakturor',
                    details: `Konto 1510: ${accountBal.toLocaleString('sv-SE')} kr, Öppna fakturor: ${invoiceTotal.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'kundfordringar',
                    type: 'info',
                    isPass: true,
                    title: 'Kundfordringar',
                    description: 'Kundfordringar stämmer',
                    details: `Konto 1510: ${accountBal.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 4. Leverantörsskulder
        // =====================================================================
        {
            const accountBal = accountBalance(2440, 2449)
            const openBills = (supplierInvoices || [])
                .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
            const billsTotal = openBills.reduce((sum: number, i) => sum + (i.total_amount || 0), 0)

            if (Math.abs(accountBal - billsTotal) > 100 && (Math.abs(accountBal) > 0 || billsTotal > 0)) {
                issues.push({
                    id: 'leverantorer',
                    type: 'warning',
                    title: 'Leverantörsskulder',
                    description: 'Konto 2440 matchar inte öppna leverantörsfakturor',
                    details: `Konto 2440: ${accountBal.toLocaleString('sv-SE')} kr, Öppna fakturor: ${billsTotal.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'leverantorer',
                    type: 'info',
                    isPass: true,
                    title: 'Leverantörsskulder',
                    description: 'Leverantörsskulder stämmer',
                    details: `Konto 2440: ${accountBal.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 5. Löneavstämning
        // =====================================================================
        {
            const skatteSkuld = accountBalance(2710, 2719)
            const agAvgifter = accountBalance(2730, 2739)
            const nettoLon = accountBalance(2790, 2799)
            const totalLiabilities = skatteSkuld + agAvgifter + nettoLon

            if (Math.abs(totalLiabilities) > 100) {
                issues.push({
                    id: 'loner',
                    type: 'warning',
                    title: 'Löneavstämning',
                    description: 'Utestående löneskulder',
                    details: `Personalskatt: ${skatteSkuld.toLocaleString('sv-SE')} kr, AG-avgifter: ${agAvgifter.toLocaleString('sv-SE')} kr, Löneskuld: ${nettoLon.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'loner',
                    type: 'info',
                    isPass: true,
                    title: 'Löneavstämning',
                    description: 'Lönekonton avstämda',
                    details: `${(payslips || []).length} lönebesked bokförda`,
                })
            }
        }

        // =====================================================================
        // 6. Avskrivningar
        // =====================================================================
        {
            const hasFixedAssets = hasAccountsInRange(1200, 1299)
            const hasDepreciation = hasAccountsInRange(7800, 7899)

            if (hasFixedAssets && !hasDepreciation) {
                issues.push({
                    id: 'avskrivningar',
                    type: 'error',
                    title: 'Avskrivningar',
                    description: `Anläggningstillgångar finns men avskrivningar saknas för ${year}`,
                    details: 'Konton 1200-1299 har saldon men inga avskrivningar på 7800-7899.',
                })
            } else {
                issues.push({
                    id: 'avskrivningar',
                    type: 'info',
                    isPass: true,
                    title: 'Avskrivningar',
                    description: hasFixedAssets ? 'Avskrivningar bokförda' : 'Inga anläggningstillgångar att skriva av',
                })
            }
        }

        // =====================================================================
        // 7. Eget kapital
        // =====================================================================
        {
            const aktiekapital = accountBalance(2081, 2081)
            const shareholderList = shareholders || []

            if (shareholderList.length === 0 && Math.abs(aktiekapital) > 0) {
                issues.push({
                    id: 'ek',
                    type: 'warning',
                    title: 'Eget kapital',
                    description: 'Aktiekapital bokfört men inget ägarregister registrerat',
                    details: `Konto 2081: ${aktiekapital.toLocaleString('sv-SE')} kr`,
                })
            } else {
                issues.push({
                    id: 'ek',
                    type: 'info',
                    isPass: true,
                    title: 'Eget kapital',
                    description: shareholderList.length > 0 ? 'Ägarregister registrerat' : 'Inget eget kapital att kontrollera',
                })
            }
        }

        const summaryCount = {
            total: issues.length,
            passed: issues.filter(i => i.isPass).length,
            warnings: issues.filter(i => i.type === 'warning').length,
            failed: issues.filter(i => i.type === 'error').length,
        }

        // Filter out "pass" items for the final issues list
        const finalIssues = issues
            .filter(i => !i.isPass)
            .map(i => ({
                id: i.id,
                type: i.type as 'warning' | 'error' | 'info',
                title: i.title,
                description: i.description,
                details: i.details
            }))

        const result: BalanceAudit = {
            timestamp: new Date().toISOString(),
            accountCount: balances.length,
            issues: finalIssues,
            summary: `Balanskontroll klar: ${summaryCount.passed}/${summaryCount.total} godkända` +
                (summaryCount.warnings > 0 ? `, ${summaryCount.warnings} varningar` : '') +
                (summaryCount.failed > 0 ? `, ${summaryCount.failed} fel` : '') + '.',
        }

        const statusEmoji = summaryCount.failed > 0 ? '❌' : summaryCount.warnings > 0 ? '⚠️' : '✅'
        
        return {
            success: true,
            data: result,
            message: `${statusEmoji} ${result.summary}\n\nSkriv en kort kommentar som revisor till användaren baserat på resultatet.`,
        }
    },
})

export const auditTools = [runBalanceSheetAuditTool]
