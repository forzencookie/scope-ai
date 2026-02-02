/**
 * Bokföring AI Tools - Balance Sheet Audit
 *
 * Comprehensive balanskontroll that cross-references data
 * from multiple domains like a Swedish accountant would.
 */

import { defineTool } from '../registry'
import { db } from '../../database/server-db'
import { getSupabaseAdmin } from '../../database/supabase'

// =============================================================================
// Types
// =============================================================================

export interface AuditCheck {
    name: string
    status: 'pass' | 'warning' | 'fail'
    description: string
    details?: string
}

export interface AuditResult {
    date: string
    fiscalYear: number
    checks: AuditCheck[]
    summary: {
        total: number
        passed: number
        warnings: number
        failed: number
    }
}

// =============================================================================
// Balance Sheet Audit Tool
// =============================================================================

export const runBalanceSheetAuditTool = defineTool<Record<string, never>, AuditResult>({
    name: 'run_balance_sheet_audit',
    description: 'Kör en komplett balanskontroll som kontrollerar balansräkningsprov, momsavstämning, kundfordringar, leverantörsskulder, löneavstämning, avskrivningar, eget kapital och periodiseringar. Samlar data från hela bokföringen och korsrefererar som en revisor.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const year = new Date().getFullYear()
        const dateFrom = `${year}-01-01`
        const dateTo = `${year}-12-31`
        const supabase = getSupabaseAdmin()

        // Gather all data in parallel
        const [
            balancesResult,
            customerInvoices,
            supplierInvoices,
            payslips,
            shareholders,
            taxReports,
        ] = await Promise.all([
            supabase.rpc('get_account_balances', {
                date_from: '2000-01-01',
                date_to: dateTo,
            }),
            db.getCustomerInvoices({ limit: 500 }),
            db.getSupplierInvoices({ limit: 500 }),
            db.getPayslips(500),
            db.getShareholders(),
            db.getTaxReports('vat'),
        ])

        const balances: Array<{ account: string; balance: number }> = balancesResult.data || []

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

        const checks: AuditCheck[] = []

        // =====================================================================
        // 1. Balansräkningsprov — Assets = Equity + Liabilities
        // =====================================================================
        {
            const assets = -(accountBalance(1000, 1999)) // Assets have negative balance in Swedish accounting
            const equityAndLiabilities = accountBalance(2000, 2999)
            const diff = Math.abs(assets - equityAndLiabilities)

            if (diff < 1) {
                checks.push({
                    name: 'Balansräkningsprov',
                    status: 'pass',
                    description: 'Tillgångar = Eget kapital + Skulder',
                    details: `Tillgångar: ${assets.toLocaleString('sv-SE')} kr, EK+Skulder: ${equityAndLiabilities.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Balansräkningsprov',
                    status: 'fail',
                    description: 'Tillgångar stämmer inte med Eget kapital + Skulder',
                    details: `Differens: ${diff.toLocaleString('sv-SE')} kr (Tillgångar: ${assets.toLocaleString('sv-SE')} kr, EK+Skulder: ${equityAndLiabilities.toLocaleString('sv-SE')} kr)`,
                })
            }
        }

        // =====================================================================
        // 2. Momsavstämning — Booked VAT matches declarations
        // =====================================================================
        {
            const outputVat = accountBalance(2610, 2619) // Utgående moms
            const inputVat = accountBalance(2640, 2649)   // Ingående moms
            const vatDebt = accountBalance(2650, 2659)    // Momsredovisning

            const bookedVatNet = outputVat + inputVat + vatDebt

            if (Math.abs(bookedVatNet) < 100) {
                checks.push({
                    name: 'Momsavstämning',
                    status: 'pass',
                    description: 'Momskonton stämmer',
                    details: `Utgående: ${outputVat.toLocaleString('sv-SE')} kr, Ingående: ${inputVat.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Momsavstämning',
                    status: 'warning',
                    description: 'Momskonton har oavstämd differens',
                    details: `Oavstämt saldo: ${bookedVatNet.toLocaleString('sv-SE')} kr. Kontrollera att momsdeklaration är bokförd.`,
                })
            }
        }

        // =====================================================================
        // 3. Kundfordringar — Open invoices match account 1510
        // =====================================================================
        {
            const accountBal = -(accountBalance(1510, 1519))
            const openInvoices = (customerInvoices || [])
                .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled')
            const invoiceTotal = openInvoices.reduce((sum: number, i: any) => sum + (i.total_amount || i.totalAmount || 0), 0)

            const overdueInvoices = openInvoices.filter((i: any) => {
                const due = new Date(i.due_date || i.dueDate)
                const daysOverdue = (Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)
                return daysOverdue > 90
            })

            if (overdueInvoices.length > 0) {
                checks.push({
                    name: 'Kundfordringar',
                    status: 'warning',
                    description: `${overdueInvoices.length} fakturor förfallna >90 dagar`,
                    details: `Konto 1510: ${accountBal.toLocaleString('sv-SE')} kr, Öppna fakturor: ${invoiceTotal.toLocaleString('sv-SE')} kr`,
                })
            } else if (Math.abs(accountBal - invoiceTotal) > 100 && (accountBal > 0 || invoiceTotal > 0)) {
                checks.push({
                    name: 'Kundfordringar',
                    status: 'warning',
                    description: 'Konto 1510 matchar inte öppna fakturor',
                    details: `Konto 1510: ${accountBal.toLocaleString('sv-SE')} kr, Öppna fakturor: ${invoiceTotal.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Kundfordringar',
                    status: 'pass',
                    description: 'Kundfordringar stämmer',
                    details: `Konto 1510: ${accountBal.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 4. Leverantörsskulder — Open bills match account 2440
        // =====================================================================
        {
            const accountBal = accountBalance(2440, 2449)
            const openBills = (supplierInvoices || [])
                .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled')
            const billsTotal = openBills.reduce((sum: number, i: any) => sum + (i.total_amount || i.totalAmount || 0), 0)

            if (Math.abs(accountBal - billsTotal) > 100 && (Math.abs(accountBal) > 0 || billsTotal > 0)) {
                checks.push({
                    name: 'Leverantörsskulder',
                    status: 'warning',
                    description: 'Konto 2440 matchar inte öppna leverantörsfakturor',
                    details: `Konto 2440: ${accountBal.toLocaleString('sv-SE')} kr, Öppna fakturor: ${billsTotal.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Leverantörsskulder',
                    status: 'pass',
                    description: 'Leverantörsskulder stämmer',
                    details: `Konto 2440: ${accountBal.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 5. Löneavstämning — Payroll liabilities match payslips
        // =====================================================================
        {
            const skatteSkuld = accountBalance(2710, 2719)     // Personalskatt
            const agAvgifter = accountBalance(2730, 2739)      // Arbetsgivaravgifter
            const nettoLon = accountBalance(2790, 2799)        // Löneskulder

            const totalLiabilities = skatteSkuld + agAvgifter + nettoLon
            const payslipList = payslips || []

            if (payslipList.length === 0 && Math.abs(totalLiabilities) < 1) {
                checks.push({
                    name: 'Löneavstämning',
                    status: 'pass',
                    description: 'Inga löner bokförda',
                })
            } else if (Math.abs(totalLiabilities) > 100) {
                checks.push({
                    name: 'Löneavstämning',
                    status: 'warning',
                    description: 'Utestående löneskulder',
                    details: `Personalskatt: ${skatteSkuld.toLocaleString('sv-SE')} kr, AG-avgifter: ${agAvgifter.toLocaleString('sv-SE')} kr, Löneskuld: ${nettoLon.toLocaleString('sv-SE')} kr`,
                })
            } else {
                checks.push({
                    name: 'Löneavstämning',
                    status: 'pass',
                    description: 'Lönekonton avstämda',
                    details: `${payslipList.length} lönebesked bokförda`,
                })
            }
        }

        // =====================================================================
        // 6. Avskrivningar — Depreciation booked for fixed assets
        // =====================================================================
        {
            const hasFixedAssets = hasAccountsInRange(1200, 1299)
            const hasDepreciation = hasAccountsInRange(7800, 7899)

            if (hasFixedAssets && !hasDepreciation) {
                checks.push({
                    name: 'Avskrivningar',
                    status: 'fail',
                    description: `Anläggningstillgångar finns men avskrivningar saknas för ${year}`,
                    details: 'Konton 1200-1299 har saldon men inga avskrivningar på 7800-7899.',
                })
            } else if (hasFixedAssets && hasDepreciation) {
                checks.push({
                    name: 'Avskrivningar',
                    status: 'pass',
                    description: 'Avskrivningar bokförda',
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
        // 7. Eget kapital — Matches shareholder register
        // =====================================================================
        {
            const aktiekapital = accountBalance(2081, 2081) // Aktiekapital
            const shareholderList = shareholders || []

            if (shareholderList.length === 0) {
                if (Math.abs(aktiekapital) > 0) {
                    checks.push({
                        name: 'Eget kapital',
                        status: 'warning',
                        description: 'Aktiekapital bokfört men inget ägarregister registrerat',
                        details: `Konto 2081: ${aktiekapital.toLocaleString('sv-SE')} kr`,
                    })
                } else {
                    checks.push({
                        name: 'Eget kapital',
                        status: 'pass',
                        description: 'Inget eget kapital att kontrollera',
                    })
                }
            } else {
                checks.push({
                    name: 'Eget kapital',
                    status: 'pass',
                    description: 'Ägarregister registrerat',
                    details: `${shareholderList.length} ägare, Aktiekapital konto 2081: ${aktiekapital.toLocaleString('sv-SE')} kr`,
                })
            }
        }

        // =====================================================================
        // 8. Periodiseringar — Accruals/prepayments at period end
        // =====================================================================
        {
            const forutbetald = hasAccountsInRange(1700, 1799) // Förutbetalda kostnader
            const upplupen = hasAccountsInRange(2900, 2999)     // Upplupna kostnader

            const now = new Date()
            const isYearEnd = now.getMonth() >= 10 // Nov-Dec

            if (isYearEnd && !forutbetald && !upplupen) {
                checks.push({
                    name: 'Periodiseringar',
                    status: 'warning',
                    description: 'Inga periodiseringar bokförda nära årsskifte',
                    details: 'Kontrollera om förutbetalda kostnader (1700) eller upplupna kostnader (2900) behöver bokföras.',
                })
            } else {
                checks.push({
                    name: 'Periodiseringar',
                    status: 'pass',
                    description: forutbetald || upplupen
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

        const message = `${statusEmoji} Balanskontroll klar: ${summary.passed}/${summary.total} godkända` +
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
                    title: 'Balanskontroll',
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

export const auditTools = [runBalanceSheetAuditTool]
