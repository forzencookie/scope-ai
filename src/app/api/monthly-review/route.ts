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
import { getAuthContext } from "@/lib/database/auth-server"

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

interface ActivitySection {
    type: string
    label: string
    count: number
    items: { title: string; date: string }[]
}

interface MonthlyReviewResponse {
    financial: {
        revenue: number
        expenses: number
        result: number
    }
    sections: Section[]
    activity: ActivitySection[]
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
        const ctx = await getAuthContext()
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { supabase } = ctx

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
            supabase
                .from('transactions')
                .select('id, status')
                .gte('date', startDate)
                .lte('date', endDate),

            // 1: Customer invoices
            supabase
                .from('customer_invoices')
                .select('id, status')
                .gte('invoice_date', startDate)
                .lte('invoice_date', endDate),

            // 2: Supplier invoices
            supabase
                .from('supplier_invoices')
                .select('id, status')
                .gte('issue_date', startDate)
                .lte('issue_date', endDate),

            // 3: Receipts
            supabase
                .from('receipts')
                .select('id, status')
                .gte('date', startDate)
                .lte('date', endDate),

            // 4: Payslips
            supabase
                .from('payslips')
                .select('id, status')
                .eq('year', year)
                .eq('month', month),

            // 5: VAT reports
            supabase
                .from('tax_reports')
                .select('id, status, period_id')
                .eq('type', 'vat')
                .eq('period_id', quarterPeriodId),

            // 6: Verifications (count only)
            supabase
                .from('verifications')
                .select('id', { count: 'exact', head: true })
                .gte('date', startDate)
                .lte('date', endDate),

            // 7: Financial balances
            supabase.rpc('get_account_balances', {
                p_date_from: startDate,
                p_date_to: endDate,
            }),

            // 8: AI conversations in this month
            supabase
                .from('conversations')
                .select('id, title, created_at')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('created_at', { ascending: false }),

            // 9: Completed roadmap steps in this month
            supabase
                .from('roadmap_steps')
                .select('id, title, updated_at')
                .eq('status', 'completed')
                .gte('updated_at', `${startDate}T00:00:00`)
                .lte('updated_at', `${endDate}T23:59:59`)
                .order('updated_at', { ascending: false }),
        ])

        // Extract results safely from allSettled
        interface QueryResult {
            data: Record<string, unknown>[] | null
            count: number | null
            error: unknown
        }
        const extract = (idx: number): QueryResult => {
            const r = results[idx]
            if (r.status === 'fulfilled') return r.value as QueryResult
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
        const conversationResult = extract(8)
        const roadmapResult = extract(9)

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

        // Activity sections (conversations + roadmap)
        const activity: ActivitySection[] = []

        const conversations = (conversationResult.data || []) as { id: string; title: string; created_at: string }[]
        if (conversations.length > 0) {
            activity.push({
                type: 'conversations',
                label: 'AI-konversationer',
                count: conversations.length,
                items: conversations.slice(0, 5).map(c => ({
                    title: c.title || 'Konversation utan titel',
                    date: c.created_at,
                })),
            })
        }

        const completedSteps = (roadmapResult.data || []) as { id: string; title: string; updated_at: string }[]
        if (completedSteps.length > 0) {
            activity.push({
                type: 'roadmap',
                label: 'Avklarade steg',
                count: completedSteps.length,
                items: completedSteps.slice(0, 5).map(s => ({
                    title: s.title,
                    date: s.updated_at,
                })),
            })
        }

        const response: MonthlyReviewResponse = {
            financial: {
                revenue,
                expenses,
                result: revenue - expenses,
            },
            sections,
            activity,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Failed to fetch monthly review:", error)
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
    }
}
