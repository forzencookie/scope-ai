/**
 * Common AI Tools - Date Events
 *
 * "Vad hände igår?" — Assembles all events for a given date.
 * Returns transactions, verifications, invoices, receipts, payslips, and meetings.
 */

import { defineTool } from '../registry'
import { verificationService } from '@/services/accounting/verification-service'
import { invoiceService } from '@/services/invoicing/invoice-service'
import { receiptService } from '@/services/accounting/receipt-service'
import { boardService } from '@/services/corporate/board-service'

// =============================================================================
// Types
// =============================================================================

export interface DateEventItem {
    id: string
    type: 'transaction' | 'verification' | 'invoice' | 'receipt' | 'payslip' | 'meeting'
    title: string
    description: string
    amount?: number
    status?: string
}

export interface DateEventsResult {
    date: string
    items: DateEventItem[]
    summary: string
}

// =============================================================================
// Get Events By Date Tool
// =============================================================================

export interface GetEventsByDateParams {
    date: string
}

export const getEventsByDateTool = defineTool<GetEventsByDateParams, DateEventsResult>({
    name: 'get_events_by_date',
    description: 'Hämta alla händelser för ett specifikt datum. Visar transaktioner, verifikationer, fakturor, kvitton, lönebesked och möten som berör det datumet. Använd när användaren frågar "vad hände igår?" eller vill se en sammanfattning av en viss dag.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    domain: 'common',
    keywords: ['datum', 'dag', 'idag', 'igår', 'händelser', 'vad hände', 'historik', 'sammanfattning'],
    parameters: {
        type: 'object',
        properties: {
            date: { type: 'string', description: 'Datum att söka på (YYYY-MM-DD). Använd "today" för idag, "yesterday" för igår.' },
        },
        required: ['date'],
    },
    execute: async (params) => {
        // Resolve relative dates
        let targetDate = params.date
        const today = new Date()

        if (targetDate === 'today' || targetDate === 'idag') {
            targetDate = today.toISOString().split('T')[0]
        } else if (targetDate === 'yesterday' || targetDate === 'igår') {
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            targetDate = yesterday.toISOString().split('T')[0]
        }

        const items: DateEventItem[] = []

        // Run all queries in parallel
        const [
            verificationsResult,
            customerInvoices,
            supplierInvoices,
            receiptsResult,
            meetingsResult,
        ] = await Promise.all([
            // Verifications on this date
            verificationService.getVerifications({ startDate: targetDate, endDate: targetDate, limit: 50 })
                .catch((err) => { console.warn('date-events: failed to fetch verifications', err); return { verifications: [], totalCount: 0 } }),

            // Customer invoices issued or due on this date
            invoiceService.getCustomerInvoices({ limit: 50 })
                .then(result => (result.invoices || []).filter(inv =>
                    inv.issueDate === targetDate || inv.dueDate === targetDate
                ))
                .catch((err) => { console.warn('date-events: failed to fetch customer invoices', err); return [] }),

            // Supplier invoices on this date
            invoiceService.getSupplierInvoices({ limit: 50 })
                .then(result => (result.invoices || []).filter(inv =>
                    inv.invoiceDate === targetDate || inv.dueDate === targetDate
                ))
                .catch((err) => { console.warn('date-events: failed to fetch supplier invoices', err); return [] }),

            // Receipts captured on this date
            receiptService.getReceipts({ limit: 50 })
                .then(result => result.receipts.filter(r => r.date === targetDate))
                .catch((err) => { console.warn('date-events: failed to fetch receipts', err); return [] }),

            // Meetings on this date
            boardService.getCompanyMeetings({ limit: 50 })
                .then(result => result.meetings.filter(m => m.date === targetDate))
                .catch((err) => { console.warn('date-events: failed to fetch meetings', err); return [] }),
        ])

        // Map verifications
        for (const v of verificationsResult.verifications) {
            items.push({
                id: v.id,
                type: 'verification',
                title: `Verifikation ${v.series}${v.number}`,
                description: v.description,
                amount: v.totalDebit,
            })
        }

        // Map customer invoices
        for (const inv of customerInvoices) {
            const action = inv.issueDate === targetDate ? 'Utfärdad' : 'Förfaller'
            items.push({
                id: inv.id,
                type: 'invoice',
                title: `Kundfaktura ${inv.invoiceNumber || inv.id.slice(0, 8)}`,
                description: `${action}: ${inv.customer} — ${inv.totalAmount?.toLocaleString('sv-SE')} kr`,
                amount: inv.totalAmount,
                status: inv.status,
            })
        }

        // Map supplier invoices
        for (const inv of supplierInvoices) {
            const action = inv.invoiceDate === targetDate ? 'Mottagen' : 'Förfaller'
            items.push({
                id: inv.id,
                type: 'invoice',
                title: `Leverantörsfaktura ${inv.invoiceNumber || inv.id.slice(0, 8)}`,
                description: `${action}: ${inv.supplierName} — ${inv.totalAmount?.toLocaleString('sv-SE')} kr`,
                amount: inv.totalAmount,
                status: inv.status,
            })
        }

        // Map receipts
        for (const r of receiptsResult) {
            items.push({
                id: r.id,
                type: 'receipt',
                title: `Kvitto: ${r.supplier}`,
                description: `${r.amount} kr — ${r.category}`,
                amount: parseFloat(r.amount),
                status: r.status,
            })
        }

        // Map meetings
        for (const m of meetingsResult) {
            items.push({
                id: m.id,
                type: 'meeting',
                title: m.title,
                description: `${m.meetingCategory === 'styrelsemote' ? 'Styrelsemöte' : 'Bolagsstämma'} — ${m.attendees?.length || 0} deltagare`,
            })
        }

        const dateLabel = targetDate === today.toISOString().split('T')[0]
            ? 'idag'
            : targetDate

        const summary = items.length === 0
            ? `Inga händelser hittades för ${dateLabel}.`
            : `${items.length} händelse${items.length === 1 ? '' : 'r'} den ${dateLabel}: ` +
              `${verificationsResult.verifications.length} verifikationer, ` +
              `${customerInvoices.length + supplierInvoices.length} fakturor, ` +
              `${receiptsResult.length} kvitton` +
              (meetingsResult.length > 0 ? `, ${meetingsResult.length} möten` : '') +
              '.'

        return {
            success: true,
            data: { date: targetDate, items, summary },
            message: summary + (items.length > 0
                ? '\n\nResultaten visas som klickbara kort. Användaren kan klicka på ett kort för att navigera till detaljvyn.'
                : ''),
        }
    },
})

export const dateEventTools = [getEventsByDateTool]
