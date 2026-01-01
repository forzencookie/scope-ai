// ============================================
// Global Search Service
// Unified search across all data sources
// PRODUCTION: Uses API endpoints, no mock data
// ============================================

import type { Transaction, Receipt } from "@/types"

// ============================================
// Types
// ============================================

export type SearchResultType = 'transaction' | 'receipt' | 'employee' | 'invoice' | 'page' | 'event' | 'action'

export interface SearchResult {
    id: string
    type: SearchResultType
    title: string
    subtitle: string
    href: string
    category: string      // Category for grouping (Transaktioner, Kvitton, etc.)
    colorClass: string    // Tailwind classes for styling
    matchedField?: string // Which field matched the query
    amount?: string       // Optional amount to display
    date?: string         // Optional date to display
    status?: string       // Optional status for events/actions
}

export interface SearchResultGroup {
    category: string
    colorClass: string
    results: SearchResult[]
    viewAllHref?: string

}

// ============================================
// Category Colors (matches Sök page)
// ============================================

const searchColors: Record<string, string> = {
    "Transaktioner": "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    "Kvitton": "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    "Verifikationer": "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    "Anställda": "bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400",
    "Fakturor": "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    "Händelser": "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    "Bolagsåtgärder": "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    "Sidor": "bg-gray-100 text-gray-600 dark:bg-gray-950/50 dark:text-gray-400",
}

// ============================================
// Search Functions (API-based)
// ============================================

async function searchTransactions(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase()

    try {
        const response = await fetch('/api/transactions', { cache: 'no-store' })
        if (!response.ok) return []

        const data = await response.json()
        const transactions: Transaction[] = data.transactions || []

        return transactions
            .filter(txn =>
                txn.name.toLowerCase().includes(lowerQuery) ||
                txn.category.toLowerCase().includes(lowerQuery) ||
                txn.account.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map(txn => ({
                id: txn.id,
                type: 'transaction' as SearchResultType,
                title: txn.name,
                subtitle: txn.category,
                href: `/dashboard/bokforing?tab=transaktioner&search=${encodeURIComponent(txn.name)}`,
                category: "Transaktioner",
                colorClass: searchColors["Transaktioner"],
                matchedField: txn.name.toLowerCase().includes(lowerQuery) ? 'name' : 'category',
                amount: txn.amount,
                date: txn.date,
            }))
    } catch (error) {
        console.error('Search transactions error:', error)
        return []
    }
}

async function searchReceipts(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase()

    try {
        const response = await fetch('/api/receipts/processed', { cache: 'no-store' })
        if (!response.ok) return []

        const data = await response.json()
        const receipts: Receipt[] = data.receipts || []

        return receipts
            .filter(receipt =>
                receipt.supplier.toLowerCase().includes(lowerQuery) ||
                receipt.category.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5)
            .map(receipt => ({
                id: receipt.id,
                type: 'receipt' as SearchResultType,
                title: receipt.supplier,
                subtitle: receipt.category,
                href: `/dashboard/bokforing?tab=kvitton&search=${encodeURIComponent(receipt.supplier)}`,
                category: "Kvitton",
                colorClass: searchColors["Kvitton"],
                matchedField: receipt.supplier.toLowerCase().includes(lowerQuery) ? 'supplier' : 'category',
                amount: receipt.amount,
                date: receipt.date,
            }))
    } catch (error) {
        console.error('Search receipts error:', error)
        return []
    }
}

// ============================================
// Main Search Function
// ============================================

export interface GlobalSearchOptions {
    filters?: string[]     // Category filters (e.g., ["Bokföring", "Löner"])
    limit?: number         // Max results per category
    includePages?: boolean // Include page navigation results
}

// ============================================
// New Search Functions (Mock Data)
// ============================================

import { mockSupplierInvoices, mockShareholders, mockPartners, mockMembers, mockGeneralMeetings } from "@/data/ownership"
import { INVOICE_STATUSES } from "@/data/invoices"

async function searchInvoices(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase()

    // Filter mock invoices
    const matchedInvoices = mockSupplierInvoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        inv.supplierName.toLowerCase().includes(lowerQuery) ||
        inv.category?.toLowerCase().includes(lowerQuery) ||
        inv.amount.toString().includes(query)
    )

    return matchedInvoices.slice(0, 6).map(inv => ({
        id: inv.id,
        type: 'invoice' as SearchResultType,
        title: inv.supplierName,
        subtitle: `Faktura ${inv.invoiceNumber} · ${inv.category || 'Okategoriserad'}`,
        href: `/dashboard/bokforing?tab=kvitton&id=${inv.id}`, // Linking to receipts/invoices tab
        category: "Fakturor",
        colorClass: searchColors["Fakturor"],
        matchedField: inv.supplierName.toLowerCase().includes(lowerQuery) ? 'supplier' : 'number',
        amount: `${inv.totalAmount.toLocaleString('sv-SE')} kr`,
        date: inv.invoiceDate,
        status: inv.status
    }))
}

async function searchEmployees(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase()
    const results: SearchResult[] = []

    // 1. Shareholders
    const shareholders = mockShareholders.filter(s => s.name.toLowerCase().includes(lowerQuery))
    results.push(...shareholders.map(s => ({
        id: s.id,
        type: 'employee' as SearchResultType,
        title: s.name,
        subtitle: `Aktieägare · ${s.ownershipPercentage}% ägande`,
        href: `/dashboard/parter?tab=aktiebok&id=${s.id}`,
        category: "Parter",
        colorClass: searchColors["Parter"],
        matchedField: 'name'
    })))

    // 2. Partners
    const partners = mockPartners.filter(p => p.name.toLowerCase().includes(lowerQuery))
    results.push(...partners.map(p => ({
        id: p.id,
        type: 'employee' as SearchResultType,
        title: p.name,
        subtitle: `Delägare · ${p.type}`,
        href: `/dashboard/parter?tab=delagare&id=${p.id}`,
        category: "Parter",
        colorClass: searchColors["Parter"],
        matchedField: 'name'
    })))

    // 3. Members
    const members = mockMembers.filter(m => m.name.toLowerCase().includes(lowerQuery))
    results.push(...members.map(m => ({
        id: m.id,
        type: 'employee' as SearchResultType,
        title: m.name,
        subtitle: `Medlem · ${m.roles.join(', ') || 'Medlem'}`,
        href: `/dashboard/parter?tab=delagare&id=${m.id}`,
        category: "Parter",
        colorClass: searchColors["Parter"],
        matchedField: 'name'
    })))

    return results.slice(0, 6)
}

async function searchTaxReports(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase()
    const results: SearchResult[] = []

    // Mock Tax Reports logic
    // We'll generate dynamic matches based on common terms like "Moms", "Q3", "2024", etc.

    if (lowerQuery.includes('moms') || lowerQuery.includes('skatt') || lowerQuery.includes('deklaration') || lowerQuery.match(/q[1-4]/)) {
        // Mock findings
        const reports = [
            { id: 'tax-1', title: 'Momsdeklaration Q3 2024', type: 'Moms', date: '2024-11-12', status: 'Inskickad' },
            { id: 'tax-2', title: 'Momsdeklaration Q2 2024', type: 'Moms', date: '2024-08-12', status: 'Godkänd' },
            { id: 'tax-3', title: 'Arbetsgivardeklaration Okt', type: 'Skatt', date: '2024-11-12', status: 'Utkast' },
        ]

        const matched = reports.filter(r => r.title.toLowerCase().includes(lowerQuery))

        results.push(...matched.map(r => ({
            id: r.id,
            type: 'page' as SearchResultType,
            title: r.title,
            subtitle: `${r.type} · ${r.status}`,
            href: `/dashboard/skatt?tab=momsdeklaration&id=${r.id}`,
            category: "Skatt",
            colorClass: searchColors["Verifikationer"], // Use verification color (emerald) or Skatt (purple)? Sök page uses purple for Skatt.
            matchedField: 'title',
            date: r.date
        })))
    }

    // Also matches for "Resultat" or "Balans"
    if (lowerQuery.includes('resultat')) {
        results.push({
            id: 'rep-res',
            type: 'page' as SearchResultType,
            title: 'Resultaträkning 2024',
            subtitle: 'Rapport · Hittills i år',
            href: `/dashboard/rapporter/resultat`,
            category: "Rapporter",
            colorClass: searchColors["Fakturor"], // Orange matches Rapporter in Sök page
            matchedField: 'title'
        })
    }

    if (lowerQuery.includes('balans')) {
        results.push({
            id: 'rep-bal',
            type: 'page' as SearchResultType,
            title: 'Balansräkning 2024',
            subtitle: 'Rapport · Nuvarande ställning',
            href: `/dashboard/rapporter/balans`,
            category: "Rapporter",
            colorClass: searchColors["Fakturor"],
            matchedField: 'title'
        })
    }

    return results
}

export async function globalSearch(
    query: string,
    options: GlobalSearchOptions = {}
): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
        return []
    }

    const { filters = [] } = options
    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // 1. Transactions
    if (filters.length === 0 || filters.includes("Bokföring")) {
        const txnResults = await searchTransactions(query)
        results.push(...txnResults)
    }

    // 2. Receipts
    if (filters.length === 0 || filters.includes("Bokföring") || filters.includes("Kvitton")) {
        const receiptResults = await searchReceipts(query)
        results.push(...receiptResults)
    }

    // 3. New Sources: Invoices
    if (filters.length === 0 || filters.includes("Bokföring") || filters.includes("Fakturor")) {
        const invoiceResults = await searchInvoices(query)
        results.push(...invoiceResults)
    }

    // 4. New Sources: Employees/Partners
    if (filters.length === 0 || filters.includes("Parter") || filters.includes("Löner")) {
        const empResults = await searchEmployees(query)
        results.push(...empResults)
    }

    // 5. New Sources: Tax/Reports
    if (filters.length === 0 || filters.includes("Skatt") || filters.includes("Rapporter")) {
        const taxResults = await searchTaxReports(query)
        results.push(...taxResults)
    }

    return results
}

// ============================================
// Group Results by Category
// ============================================

export function groupSearchResults(results: SearchResult[], query?: string): SearchResultGroup[] {
    const grouped: Record<string, SearchResult[]> = {}

    for (const result of results) {
        if (!grouped[result.category]) {
            grouped[result.category] = []
        }
        grouped[result.category].push(result)
    }

    // Convert to array with metadata
    const viewAllHrefs: Record<string, string> = {
        "Transaktioner": "/dashboard/bokforing?tab=transaktioner",
        "Kvitton": "/dashboard/bokforing?tab=kvitton",
        "Verifikationer": "/dashboard/bokforing?tab=bokforing",
        "Anställda": "/dashboard/loner?tab=lonebesked",
        "Fakturor": "/dashboard/bokforing?tab=kvitton",
        "Händelser": "/dashboard/handelser",
        "Bolagsåtgärder": "/dashboard/handelser?filter=action",
    }

    return Object.entries(grouped).map(([category, results]) => {
        const hasMore = results.length > 5
        const displayResults = results.slice(0, 5)

        let viewAllHref: string | undefined = undefined
        if (hasMore && viewAllHrefs[category]) {
            viewAllHref = viewAllHrefs[category]
            if (query) {
                const separator = viewAllHref.includes('?') ? '&' : '?'
                viewAllHref += `${separator}search=${encodeURIComponent(query)}`
            }
        }

        return {
            category,
            colorClass: searchColors[category] || searchColors["Sidor"],
            results: displayResults,
            viewAllHref,
        }
    })
}
