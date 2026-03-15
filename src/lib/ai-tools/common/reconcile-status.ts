/**
 * Common AI Tools - Reconcile Status
 *
 * Scans app data for stale or inconsistent states across tables.
 * Helps Scooby proactively surface items needing attention.
 */

import { defineTool } from '../registry'
import { createAdminClient } from '../../database/client'

// =============================================================================
// Types
// =============================================================================

export interface ReconcileItem {
    area: 'transactions' | 'invoices' | 'receipts' | 'payroll' | 'bookings'
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
    description: 'Skannar appdata efter inaktuella eller inkonsekventa tillstånd. Kontrollerar obokförda transaktioner, förfallna fakturor, omatchade kvitton, utkast-lönebesked och gamla väntande bokningar. Returnerar en lista med åtgärdsförslag.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'common',
    keywords: ['status', 'reconcile', 'uppdatera', 'kontrollera', 'granska', 'kolla', 'avstämning'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const supabase = createAdminClient()
        const today = new Date().toISOString().split('T')[0]
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        // Run all 5 queries in parallel
        const [
            unbookedTx,
            overdueInvoices,
            unmatchedReceipts,
            draftPayslips,
            stalePending,
        ] = await Promise.all([
            // 1. Unbooked transactions
            supabase
                .from('transactions')
                .select('id, date, description, amount')
                .eq('status', 'Att bokföra')
                .order('date', { ascending: false })
                .limit(50),

            // 2. Overdue invoices
            supabase
                .from('customerinvoices')
                .select('id, invoice_number, customer_name, total_amount, due_date, status')
                .in('status', ['Skickad', 'sent'])
                .lt('due_date', today)
                .order('due_date', { ascending: true })
                .limit(50),

            // 3. Unmatched receipts (status = 'Väntar')
            supabase
                .from('receipts')
                .select('id, vendor, amount, captured_at')
                .eq('status', 'Väntar')
                .order('captured_at', { ascending: false })
                .limit(50),

            // 4. Draft payslips
            supabase
                .from('payslips')
                .select('id, created_at')
                .eq('status', 'draft')
                .order('created_at', { ascending: false })
                .limit(50),

            // 5. Stale pending bookings (>7 days old)
            supabase
                .from('pending_bookings')
                .select('id, source_type, description, created_at')
                .eq('status', 'pending')
                .lt('created_at', sevenDaysAgo)
                .order('created_at', { ascending: true })
                .limit(50),
        ])

        const items: ReconcileItem[] = []

        // 1. Unbooked transactions
        const txCount = unbookedTx.data?.length ?? 0
        if (txCount > 0) {
            items.push({
                area: 'transactions',
                severity: txCount > 20 ? 'critical' : 'warning',
                count: txCount,
                message: `${txCount} transaktion${txCount === 1 ? '' : 'er'} väntar på bokföring`,
                suggestion: 'Vill du att jag hjälper dig bokföra dessa? Jag kan gå igenom dem en i taget.',
                details: (unbookedTx.data ?? []).slice(0, 5).map(t => ({
                    id: t.id,
                    description: `${t.description ?? 'Okänd'} — ${t.amount} kr`,
                    date: t.date,
                })),
            })
        }

        // 2. Overdue invoices
        const invCount = overdueInvoices.data?.length ?? 0
        if (invCount > 0) {
            items.push({
                area: 'invoices',
                severity: 'critical',
                count: invCount,
                message: `${invCount} faktura${invCount === 1 ? '' : 'or'} har passerat förfallodatum`,
                suggestion: 'Kontrollera om dessa har betalats. Jag kan markera dem som betalda eller skicka en påminnelse.',
                details: (overdueInvoices.data ?? []).slice(0, 5).map(i => ({
                    id: i.id,
                    description: `${i.invoice_number ?? '—'} ${i.customer_name ?? ''} — ${i.total_amount} kr`,
                    date: i.due_date,
                })),
            })
        }

        // 3. Unmatched receipts
        const recCount = unmatchedReceipts.data?.length ?? 0
        if (recCount > 0) {
            items.push({
                area: 'receipts',
                severity: recCount >= 5 ? 'warning' : 'info',
                count: recCount,
                message: `${recCount} kvitto${recCount === 1 ? '' : 'n'} saknar koppling till transaktion`,
                suggestion: 'Jag kan försöka matcha dessa mot dina banktransaktioner.',
                details: (unmatchedReceipts.data ?? []).slice(0, 5).map(r => ({
                    id: r.id,
                    description: `${r.vendor ?? 'Okänd butik'} — ${r.amount ?? '?'} kr`,
                    date: r.captured_at ?? undefined,
                })),
            })
        }

        // 4. Draft payslips
        const payCount = draftPayslips.data?.length ?? 0
        if (payCount > 0) {
            items.push({
                area: 'payroll',
                severity: 'warning',
                count: payCount,
                message: `${payCount} lönebesked${payCount === 1 ? '' : ''} ligger som utkast`,
                suggestion: 'Dessa bör granskas och godkännas. Vill du att jag visar dem?',
                details: (draftPayslips.data ?? []).slice(0, 5).map(p => ({
                    id: p.id,
                    description: 'Utkast lönebesked',
                    date: p.created_at ?? undefined,
                })),
            })
        }

        // 5. Stale pending bookings
        const bookCount = stalePending.data?.length ?? 0
        if (bookCount > 0) {
            items.push({
                area: 'bookings',
                severity: 'info',
                count: bookCount,
                message: `${bookCount} väntande bokning${bookCount === 1 ? '' : 'ar'} äldre än 7 dagar`,
                suggestion: 'Dessa kan behöva granskas eller tas bort om de inte längre är aktuella.',
                details: (stalePending.data ?? []).slice(0, 5).map(b => ({
                    id: b.id,
                    description: `${b.source_type ?? 'Okänd källa'}: ${b.description ?? '—'}`,
                    date: b.created_at ?? undefined,
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

        // Build walkthrough sections
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
                    heading: `${severityIcon(item.severity)} ${item.area === 'transactions' ? 'Transaktioner' : item.area === 'invoices' ? 'Fakturor' : item.area === 'receipts' ? 'Kvitton' : item.area === 'payroll' ? 'Löner' : 'Bokningar'}`,
                    status: (item.severity === 'critical' ? 'fail' : item.severity === 'warning' ? 'warning' : 'pass') as 'pass' | 'warning' | 'fail',
                    description: item.message,
                    details: item.suggestion,
                })),
        }

        // Build message for AI
        const statusEmoji = summary.critical > 0 ? '🔴' : summary.warnings > 0 ? '🟡' : '✅'
        const message = items.length === 0
            ? '✅ Allt ser bra ut! Inga inkonsekvenser hittades.\n\nResultatet visas i en walkthrough-vy. Bekräfta för användaren att allt är uppdaterat.'
            : `${statusEmoji} Statusavstämning klar: ${summary.total_issues} saker att titta på.\n\n` +
              items.map(i => `${severityIcon(i.severity)} **${i.area}**: ${i.message}\n   → ${i.suggestion}`).join('\n\n') +
              '\n\n---\n\n' +
              'Resultatet visas i en walkthrough-vy för användaren. Skriv en kort sammanfattning (2-4 meningar) av vad du hittade. ' +
              'Erbjud dig att hjälpa till med de mest kritiska punkterna först. Skriv INTE ut listan igen — den visas redan i vyn.'

        return {
            success: true,
            data: { ...result, walkthrough },
            message,
        }
    },
})

export const reconcileTools = [reconcileStatusTool]
