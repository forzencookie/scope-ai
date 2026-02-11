/**
 * Monthly Review API
 *
 * GET /api/monthly-review?year=2026&month=3
 *
 * Returns detailed data for a single month: transactions, invoices, receipts,
 * payslips, VAT reports, verifications, and financial summary — all grouped
 * by status with counts for the Notion-style month review dialog.
 *
 * Security: Uses user-scoped DB access with RLS enforcement.
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

interface StatusBreakdown {
    status: string
    count: number
    variant: string
}

interface Section {
    type: string
    label: string
    totalCount: number
    statusBreakdown: StatusBreakdown[]
}

interface MonthlyReviewResponse {
    financial: {
        revenue: number
        expenses: number
        result: number
    }
    sections: Section[]
}

// Status → variant mapping (mirrors status-types.ts)
const TRANSACTION_VARIANTS: Record<string, string> = {
    "Att bokföra": "warning",
    "Bokförd": "success",
    "Saknar underlag": "error",
    "Ignorerad": "neutral",
}

const INVOICE_VARIANTS: Record<string, string> = {
    "Betald": "success",
    "Skickad": "info",
    "Utkast": "neutral",
    "Förfallen": "error",
    "Makulerad": "neutral",
    "Bokförd": "violet",
    "Mottagen": "info",
}

const SUPPLIER_VARIANTS: Record<string, string> = {
    "Mottagen": "violet",
    "Attesterad": "warning",
    "Betald": "success",
    "Förfallen": "error",
    "Tvist": "purple",
    "Bokförd": "violet",
}

const RECEIPT_VARIANTS: Record<string, string> = {
    "Verifierad": "success",
    "Väntar": "warning",
    "Bearbetar": "neutral",
    "Granskning krävs": "error",
    "Behandlad": "success",
    "Matchad": "success",
    "Avvisad": "error",
    "Bokförd": "violet",
}

const PAYSLIP_VARIANTS: Record<string, string> = {
    "draft": "neutral",
    "pending": "warning",
    "sent": "success",
    "paid": "success",
}

function groupByStatus<T extends Record<string, unknown>>(
    items: T[],
    statusField: string,
    variantMap: Record<string, string>,
    defaultStatus = "Okänd"
): StatusBreakdown[] {
    const counts = new Map<string, number>()
    for (const item of items) {
        const status = (item[statusField] as string) || defaultStatus
        counts.set(status, (counts.get(status) || 0) + 1)
    }

    return Array.from(counts.entries()).map(([status, count]) => ({
        status,
        count,
        variant: variantMap[status] || "neutral",
    }))
}

export async function GET(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb()
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()
        const month = parseInt(searchParams.get('month') || '') || (new Date().getMonth() + 1)

        if (month < 1 || month > 12) {
            return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
        }

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        // Determine which quarter this month belongs to for VAT
        const quarter = Math.ceil(month / 3)
        const quarterPeriodId = `${year}-Q${quarter}`

        // Run 8 parallel queries
        const results = await Promise.allSettled([
            // 0: Transactions
            userDb.client
                .from('transactions')
                .select('id, status')
                .gte('date', startDate)
                .lte('date', endDate),

            // 1: Customer invoices
            userDb.client
                .from('customerinvoices')
                .select('id, status')
                .gte('invoice_date', startDate)
                .lte('invoice_date', endDate),

            // 2: Supplier invoices
            userDb.client
                .from('supplierinvoices')
                .select('id, status')
                .gte('issue_date', startDate)
                .lte('issue_date', endDate),

            // 3: Receipts
            userDb.client
                .from('receipts')
                .select('id, status')
                .gte('date', startDate)
                .lte('date', endDate),

            // 4: Payslips
            userDb.client
                .from('payslips')
                .select('id, status')
                .eq('year', year)
                .eq('month', month),

            // 5: VAT reports
            userDb.client
                .from('taxreports')
                .select('id, status, period_id')
                .eq('type', 'vat')
                .eq('period_id', quarterPeriodId),

            // 6: Verifications (count only)
            userDb.client
                .from('verifications')
                .select('id', { count: 'exact', head: true })
                .gte('date', startDate)
                .lte('date', endDate),

            // 7: Financial balances
            userDb.client.rpc('get_account_balances', {
                p_start_date: startDate,
                p_end_date: endDate,
            }),
        ])

        // Extract results safely — cast to any to avoid union type issues from allSettled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extract = (idx: number): { data: any[] | null; count: number | null; error: unknown } => {
            const r = results[idx]
            if (r.status === 'fulfilled') return r.value as { data: any[] | null; count: number | null; error: unknown }
            console.error(`monthly-review query ${idx} failed:`, r.reason)
            return { data: null, count: null, error: r.reason }
        }

        const txResult = extract(0)
        const custInvResult = extract(1)
        const suppInvResult = extract(2)
        const receiptResult = extract(3)
        const payslipResult = extract(4)
        const vatResult = extract(5)
        const verifResult = extract(6)
        const balanceResult = extract(7)

        // Build sections (only include non-empty)
        const sections: Section[] = []

        const transactions = (txResult.data || []) as Record<string, unknown>[]
        if (transactions.length > 0) {
            sections.push({
                type: 'transactions',
                label: 'Transaktioner',
                totalCount: transactions.length,
                statusBreakdown: groupByStatus(transactions, 'status', TRANSACTION_VARIANTS),
            })
        }

        const customerInvoices = (custInvResult.data || []) as Record<string, unknown>[]
        if (customerInvoices.length > 0) {
            sections.push({
                type: 'customer_invoices',
                label: 'Kundfakturor',
                totalCount: customerInvoices.length,
                statusBreakdown: groupByStatus(customerInvoices, 'status', INVOICE_VARIANTS),
            })
        }

        const supplierInvoices = (suppInvResult.data || []) as Record<string, unknown>[]
        if (supplierInvoices.length > 0) {
            sections.push({
                type: 'supplier_invoices',
                label: 'Leverantörsfakturor',
                totalCount: supplierInvoices.length,
                statusBreakdown: groupByStatus(supplierInvoices, 'status', SUPPLIER_VARIANTS),
            })
        }

        const receipts = (receiptResult.data || []) as Record<string, unknown>[]
        if (receipts.length > 0) {
            sections.push({
                type: 'receipts',
                label: 'Kvitton',
                totalCount: receipts.length,
                statusBreakdown: groupByStatus(receipts, 'status', RECEIPT_VARIANTS),
            })
        }

        const payslips = (payslipResult.data || []) as Record<string, unknown>[]
        if (payslips.length > 0) {
            sections.push({
                type: 'payslips',
                label: 'Lönespecifikationer',
                totalCount: payslips.length,
                statusBreakdown: groupByStatus(payslips, 'status', PAYSLIP_VARIANTS),
            })
        }

        const vatReports = (vatResult.data || []) as Record<string, unknown>[]
        if (vatReports.length > 0) {
            sections.push({
                type: 'vat',
                label: 'Momsrapporter',
                totalCount: vatReports.length,
                statusBreakdown: groupByStatus(vatReports, 'status', { submitted: 'success', draft: 'neutral', pending: 'warning' }),
            })
        }

        // Verifications — just count
        const verificationCount = verifResult.count ?? 0
        if (verificationCount > 0) {
            sections.push({
                type: 'verifications',
                label: 'Verifikationer',
                totalCount: verificationCount,
                statusBreakdown: [],
            })
        }

        // Financial summary
        const balanceData = (balanceResult.data || []) as { account_number: number; balance: number }[]
        let revenue = 0
        let expenses = 0

        for (const row of balanceData) {
            const acc = row.account_number
            const balance = row.balance
            if (acc >= 3000 && acc <= 3999) {
                revenue += Math.abs(balance)
            } else if (acc >= 4000 && acc <= 8999) {
                expenses += balance
            }
        }

        const response: MonthlyReviewResponse = {
            financial: {
                revenue,
                expenses,
                result: revenue - expenses,
            },
            sections,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Failed to fetch monthly review:", error)
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
    }
}
