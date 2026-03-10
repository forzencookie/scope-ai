/**
 * Search API
 *
 * GET /api/search?q=...
 *
 * Searches across multiple entity types in parallel:
 * - Transactions (description, amount)
 * - Customer invoices (customer_name, invoice_number)
 * - Verifications (description)
 * - Employees (name)
 * - Conversations (title)
 *
 * Returns max 5 per entity type, 25 total.
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

// =============================================================================
// Types
// =============================================================================

export interface SearchResult {
    type: 'transaction' | 'invoice' | 'verification' | 'employee' | 'conversation'
    id: string
    label: string
    sublabel: string
    href: string
}

interface SearchGroup {
    type: SearchResult['type']
    label: string
    results: SearchResult[]
}

// =============================================================================
// Handler
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const q = request.nextUrl.searchParams.get('q')?.trim()
        if (!q || q.length < 2) {
            return Response.json({ groups: [], total: 0 })
        }

        const userDb = await createUserScopedDb()
        if (!userDb) {
            return ApiResponse.unauthorized('User session not found')
        }

        const searchPattern = `%${q}%`
        const limit = 5

        // Run all queries in parallel
        const [transactions, invoices, verifications, employees, conversations] = await Promise.allSettled([
            // Transactions
            userDb.client
                .from('transactions')
                .select('id, description, amount, date, status')
                .or(`description.ilike.${searchPattern}`)
                .order('date', { ascending: false })
                .limit(limit),

            // Customer invoices
            userDb.client
                .from('customerinvoices')
                .select('id, customer_name, invoice_number, total_amount, status')
                .or(`customer_name.ilike.${searchPattern},invoice_number.ilike.${searchPattern}`)
                .order('invoice_date', { ascending: false })
                .limit(limit),

            // Verifications
            userDb.client
                .from('verifications')
                .select('id, series, number, description, date')
                .ilike('description', searchPattern)
                .order('date', { ascending: false })
                .limit(limit),

            // Employees
            userDb.client
                .from('employees')
                .select('id, name, role, email')
                .or(`name.ilike.${searchPattern},email.ilike.${searchPattern}`)
                .limit(limit),

            // Conversations
            userDb.client
                .from('conversations')
                .select('id, title, updated_at')
                .ilike('title', searchPattern)
                .order('updated_at', { ascending: false })
                .limit(limit),
        ])

        // Build result groups
        const groups: SearchGroup[] = []

        // Transactions
        if (transactions.status === 'fulfilled' && transactions.value.data?.length) {
            groups.push({
                type: 'transaction',
                label: 'Transaktioner',
                results: transactions.value.data.map((t: Record<string, unknown>) => ({
                    type: 'transaction' as const,
                    id: String(t.id),
                    label: String(t.description || 'Transaktion'),
                    sublabel: `${formatSEK(Number(t.amount))} · ${formatDate(String(t.date))} · ${t.status || ''}`,
                    href: '/dashboard/bokforing?tab=transaktioner',
                })),
            })
        }

        // Invoices
        if (invoices.status === 'fulfilled' && invoices.value.data?.length) {
            groups.push({
                type: 'invoice',
                label: 'Fakturor',
                results: invoices.value.data.map((i: Record<string, unknown>) => ({
                    type: 'invoice' as const,
                    id: String(i.id),
                    label: `${i.invoice_number} — ${i.customer_name}`,
                    sublabel: `${formatSEK(Number(i.total_amount))} · ${i.status || ''}`,
                    href: '/dashboard/bokforing?tab=fakturor',
                })),
            })
        }

        // Verifications
        if (verifications.status === 'fulfilled' && verifications.value.data?.length) {
            groups.push({
                type: 'verification',
                label: 'Verifikationer',
                results: verifications.value.data.map((v: Record<string, unknown>) => ({
                    type: 'verification' as const,
                    id: String(v.id),
                    label: `${v.series || 'A'}${v.number || ''} — ${v.description || 'Verifikation'}`,
                    sublabel: formatDate(String(v.date)),
                    href: '/dashboard/bokforing?tab=verifikationer',
                })),
            })
        }

        // Employees
        if (employees.status === 'fulfilled' && employees.value.data?.length) {
            groups.push({
                type: 'employee',
                label: 'Anställda',
                results: employees.value.data.map((e: Record<string, unknown>) => ({
                    type: 'employee' as const,
                    id: String(e.id),
                    label: String(e.name),
                    sublabel: String(e.role || e.email || ''),
                    href: '/dashboard/loner?tab=team',
                })),
            })
        }

        // Conversations
        if (conversations.status === 'fulfilled' && conversations.value.data?.length) {
            groups.push({
                type: 'conversation',
                label: 'Konversationer',
                results: conversations.value.data.map((c: Record<string, unknown>) => ({
                    type: 'conversation' as const,
                    id: String(c.id),
                    label: String(c.title || 'Konversation'),
                    sublabel: formatRelative(String(c.updated_at)),
                    href: '/dashboard',
                })),
            })
        }

        const total = groups.reduce((sum, g) => sum + g.results.length, 0)

        return Response.json({ groups, total })
    } catch (error) {
        console.error('[Search] Error:', error)
        return ApiResponse.serverError('Search failed')
    }
}

// =============================================================================
// Helpers
// =============================================================================

function formatSEK(amount: number): string {
    if (isNaN(amount)) return ''
    return `${amount.toLocaleString('sv-SE')} kr`
}

function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    try {
        return new Date(dateStr).toLocaleDateString('sv-SE')
    } catch {
        return dateStr
    }
}

function formatRelative(dateStr: string): string {
    if (!dateStr) return ''
    try {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins} min sedan`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h sedan`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d sedan`
        return formatDate(dateStr)
    } catch {
        return dateStr
    }
}
