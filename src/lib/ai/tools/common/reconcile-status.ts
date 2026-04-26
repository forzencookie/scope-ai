/**
 * Common AI Tools - Reconcile Status
 *
 * Scans app data for stale or inconsistent states across tables.
 * Helps Scooby proactively surface items needing attention.
 */

import { defineTool } from '../registry'
import { invoiceService } from '@/services/invoicing'
import { receiptService } from '@/services/accounting'
import { payrollService } from '@/services/payroll'
import { getUnbookedTransactions } from '@/services/accounting'

// =============================================================================
// Types
// =============================================================================

export interface ReconcileItem {
    area: 'transactions' | 'invoices' | 'receipts' | 'payroll'
    severity: 'info' | 'warning' | 'critical'
    count: number
    message: string
    suggestion: string
    details?: Array<{ id: string; description: string; date?: string }>
}

export interface ReconcileResult {
    date: string
    items: ReconcileItem[]
    summary: { total_issues: number; critical: number; warnings: number }
}

// =============================================================================
// Reconcile Status Tool
// =============================================================================

export const reconcileStatusTool = defineTool<Record<string, never>, ReconcileResult>({
    name: 'reconcile_status',
    description: 'Skannar appdata efter inaktuella eller inkonsekventa tillstånd. Kontrollerar obokförda transaktioner, förfallna fakturor, omatchade kvitton och utkast-lönebesked. Returnerar en lista med åtgärdsförslag.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['status', 'reconcile', 'uppdatera', 'kontrollera', 'granska', 'kolla', 'avstämning'],
    parameters: { type: 'object', properties: {} },
    execute: async (_params, context) => {
        const today = new Date().toISOString().split('T')[0]
        const userId = context?.userId

        if (!userId) {
            return { success: false, error: 'Ingen inloggad användare.' }
        }

        // Run queries via service layer
        const [
            unbookedTx,
            overdueCustomerInv,
            overdueSupplierInv,
            unmatchedReceipts,
            unpaidPayslips,
        ] = await Promise.all([
            getUnbookedTransactions(userId),
            invoiceService.getOverdueCustomerInvoices(),
            invoiceService.getOverdueSupplierInvoices(),
            receiptService.getUnbookedReceipts(),
            payrollService.getUnpaidPayslips(),
        ])

        const items: ReconcileItem[] = []

        // 1. Unbooked transactions
        const txCount = unbookedTx.length
        if (txCount > 0) {
            items.push({
                area: 'transactions',
                severity: txCount > 20 ? 'critical' : 'warning',
                count: txCount,
                message: `${txCount} transaktion${txCount === 1 ? '' : 'er'} väntar på bokföring`,
                suggestion: 'Vill du att jag hjälper dig bokföra dessa? Jag kan gå igenom dem en i taget.',
                details: unbookedTx.slice(0, 5).map(t => ({
                    id: t.id,
                    description: `${t.description || t.name} — ${t.amount}`,
                    date: t.date,
                })),
            })
        }

        // 2. Overdue invoices
        const invCount = overdueCustomerInv.length + overdueSupplierInv.length
        if (invCount > 0) {
            items.push({
                area: 'invoices',
                severity: 'critical',
                count: invCount,
                message: `${invCount} faktura${invCount === 1 ? '' : 'or'} har passerat förfallodatum`,
                suggestion: 'Kontrollera om dessa har betalats. Jag kan markera dem som betalda eller skicka en påminnelse.',
                details: [
                    ...overdueCustomerInv.slice(0, 3).map(i => ({
                        id: i.id,
                        description: `Utgående: ${i.invoiceNumber} ${i.customer} — ${i.totalAmount} kr`,
                        date: i.dueDate,
                    })),
                    ...overdueSupplierInv.slice(0, 2).map(i => ({
                        id: i.id,
                        description: `Inkommande: ${i.invoiceNumber} ${i.supplierName} — ${i.totalAmount} kr`,
                        date: i.dueDate,
                    }))
                ],
            })
        }

        // 3. Unmatched receipts
        const recCount = unmatchedReceipts.length
        if (recCount > 0) {
            items.push({
                area: 'receipts',
                severity: recCount >= 5 ? 'warning' : 'info',
                count: recCount,
                message: `${recCount} kvitto${recCount === 1 ? '' : 'n'} saknar koppling till transaktion`,
                suggestion: 'Jag kan försöka matcha dessa mot dina banktransaktioner.',
                details: unmatchedReceipts.slice(0, 5).map(r => ({
                    id: r.id,
                    description: `${r.supplier} — ${r.amount} kr`,
                    date: r.date,
                })),
            })
        }

        // 4. Draft payslips
        const draftPayslips = unpaidPayslips.filter(p => p.status === 'Utkast')
        const payCount = draftPayslips.length
        if (payCount > 0) {
            items.push({
                area: 'payroll',
                severity: 'warning',
                count: payCount,
                message: `${payCount} lönebesked ligger som utkast`,
                suggestion: 'Dessa bör granskas och godkännas. Vill du att jag visar dem?',
                details: draftPayslips.slice(0, 5).map(p => ({
                    id: p.id,
                    description: `Utkast: ${p.employeeName} (${p.period})`,
                    date: p.sentAt,
                })),
            })
        }

        // Build summary
        const summary = {
            total_issues: items.reduce((sum, i) => sum + i.count, 0),
            critical: items.filter(i => i.severity === 'critical').reduce((sum, i) => sum + i.count, 0),
            warnings: items.filter(i => i.severity === 'warning').reduce((sum, i) => sum + i.count, 0),
        }

        const result: ReconcileResult = {
            date: today,
            items,
            summary,
        }

        const severityIcon = (s: string) => s === 'critical' ? '🔴' : s === 'warning' ? '🟡' : '🔵'

        const walkthrough = {
            title: 'Statusavstämning',
            summary: items.length === 0
                ? 'Allt ser bra ut — inga åtgärder krävs!'
                : `${summary.total_issues} saker att titta på` +
                  (summary.critical > 0 ? ` (${summary.critical} kritiska)` : ''),
            date: today,
            sections: items.length === 0
                ? [{ heading: 'Allt uppdaterat', status: 'pass' as const, description: 'Inga inkonsekvenser hittades.' }]
                : items.map(item => ({
                    heading: `${severityIcon(item.severity)} ${item.area === 'transactions' ? 'Transaktioner' : item.area === 'invoices' ? 'Fakturor' : item.area === 'receipts' ? 'Kvitton' : 'Löner'}`,
                    status: (item.severity === 'critical' ? 'fail' : item.severity === 'warning' ? 'warning' : 'pass') as 'pass' | 'warning' | 'fail',
                    description: item.message,
                    details: item.suggestion,
                })),
        }

        const statusEmoji = summary.critical > 0 ? '🔴' : summary.warnings > 0 ? '🟡' : '✅'
        const message = items.length === 0
            ? '✅ Allt ser bra ut! Inga inkonsekvenser hittades.\n\nResultatet visas i en walkthrough-vy. Bekräfta för användaren att allt är uppdaterat.'
            : `${statusEmoji} Statusavstämning klar: ${summary.total_issues} saker att titta på.\n\n` +
              items.map(i => `${severityIcon(i.severity)} **${i.area}**: ${i.message}\n   → ${i.suggestion}`).join('\n\n') +
              '\n\n---\n\n' +
              'Resultatet visas i en walkthrough-vy för användaren. Skriv en kort sammanfattning (2-4 meningar) av vad du hittade. ' +
              'Erbjud dig att hjälpa till med de mest kritiska punkterna först. Skriv INTE ut listan igen — de visas redan i vyn.'

        return {
            success: true,
            data: { ...result, walkthrough },
            message,
        }
    },
})

export const reconcileTools = [reconcileStatusTool]
