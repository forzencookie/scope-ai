// ============================================
// Global Search Service
// Unified search across all data sources
// ============================================

import { mockTransactions } from "@/data/transactions"
import { mockReceipts } from "@/data/receipts"
import type { Transaction, Receipt } from "@/types"

// ============================================
// Types
// ============================================

export type SearchResultType = 'transaction' | 'receipt' | 'employee' | 'invoice' | 'page'

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
}

export interface SearchResultGroup {
    category: string
    colorClass: string
    results: SearchResult[]
    viewAllHref: string
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
    "Sidor": "bg-gray-100 text-gray-600 dark:bg-gray-950/50 dark:text-gray-400",
}

// ============================================
// Search Functions
// ============================================

function searchTransactions(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase()

    return mockTransactions
        .filter(txn =>
            txn.name.toLowerCase().includes(lowerQuery) ||
            txn.category.toLowerCase().includes(lowerQuery) ||
            txn.account.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5) // Limit results
        .map(txn => ({
            id: txn.id,
            type: 'transaction' as SearchResultType,
            title: txn.name,
            subtitle: txn.category,
            href: `/dashboard/sok/bokforing?tab=transaktioner&search=${encodeURIComponent(txn.name)}`,
            category: "Transaktioner",
            colorClass: searchColors["Transaktioner"],
            matchedField: txn.name.toLowerCase().includes(lowerQuery) ? 'name' : 'category',
            amount: txn.amount,
            date: txn.date,
        }))
}

function searchReceipts(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase()

    return mockReceipts
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
            href: `/dashboard/sok/bokforing?tab=kvitton&search=${encodeURIComponent(receipt.supplier)}`,
            category: "Kvitton",
            colorClass: searchColors["Kvitton"],
            matchedField: receipt.supplier.toLowerCase().includes(lowerQuery) ? 'supplier' : 'category',
            amount: receipt.amount,
            date: receipt.date,
        }))
}

// ============================================
// Main Search Function
// ============================================

export interface GlobalSearchOptions {
    filters?: string[]     // Category filters (e.g., ["Bokföring", "Löner"])
    limit?: number         // Max results per category
    includePages?: boolean // Include page navigation results
}

export async function globalSearch(
    query: string,
    options: GlobalSearchOptions = {}
): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
        return []
    }

    const { filters = [], limit = 5 } = options
    const results: SearchResult[] = []

    // Determine which data sources to search based on filters
    const searchBokforing = filters.length === 0 || filters.includes("Bokföring")
    const searchLoner = filters.length === 0 || filters.includes("Löner")
    const searchRapporter = filters.length === 0 || filters.includes("Rapporter")

    // Search transactions
    if (searchBokforing) {
        results.push(...searchTransactions(query))
    }

    // Search receipts
    if (searchBokforing) {
        results.push(...searchReceipts(query))
    }

    // TODO: Add more data sources as needed:
    // - searchEmployees(query) for Löner
    // - searchInvoices(query) for Fakturor
    // - searchVerifikationer(query) for Verifikationer

    return results
}

// ============================================
// Group Results by Category
// ============================================

export function groupSearchResults(results: SearchResult[]): SearchResultGroup[] {
    const grouped: Record<string, SearchResult[]> = {}

    for (const result of results) {
        if (!grouped[result.category]) {
            grouped[result.category] = []
        }
        grouped[result.category].push(result)
    }

    // Convert to array with metadata
    const viewAllHrefs: Record<string, string> = {
        "Transaktioner": "/dashboard/sok/bokforing?tab=transaktioner",
        "Kvitton": "/dashboard/sok/bokforing?tab=kvitton",
        "Verifikationer": "/dashboard/sok/bokforing?tab=verifikationer",
        "Anställda": "/dashboard/sok/loner?tab=lonebesked",
        "Fakturor": "/dashboard/sok/bokforing?tab=kvitton",
    }

    return Object.entries(grouped).map(([category, results]) => ({
        category,
        colorClass: searchColors[category] || searchColors["Sidor"],
        results,
        viewAllHref: viewAllHrefs[category] || "/dashboard/sok",
    }))
}
