/**
 * Persistent storage for unauthenticated users
 * 
 * Solves the scalability issue of in-memory state by:
 * - Persisting data to localStorage for unauthenticated users
 * - Providing a consistent interface for both authenticated and unauthenticated scenarios
 * - Automatic expiration of old data
 * - Storage quota management
 */

import type { Transaction, TransactionWithAI } from "@/types"
import type { Invoice } from "@/data/invoices"
import type { Receipt } from "@/data/receipts"

// Storage keys
const STORAGE_KEYS = {
    transactions: "scope_demo_transactions",
    invoices: "scope_demo_invoices",
    receipts: "scope_demo_receipts",
    metadata: "scope_demo_metadata",
} as const

// Data expiration time (7 days)
const DATA_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000

// Max storage size per key (500KB)
const MAX_STORAGE_SIZE = 500 * 1024

interface StorageMetadata {
    version: number
    createdAt: number
    lastUpdated: number
}

interface StoredData<T> {
    data: T
    timestamp: number
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

/**
 * Check if data has expired
 */
function isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > DATA_EXPIRATION_MS
}

/**
 * Get approximate size of data in bytes
 */
function getDataSize(data: unknown): number {
    return new Blob([JSON.stringify(data)]).size
}

/**
 * Safe localStorage getter with error handling
 */
function safeGetItem<T>(key: string): T | null {
    if (!isBrowser()) return null

    try {
        const item = localStorage.getItem(key)
        if (!item) return null

        const stored = JSON.parse(item) as unknown
        
        // Validate the stored data structure
        if (!stored || typeof stored !== 'object') {
            localStorage.removeItem(key)
            return null
        }
        
        const storedData = stored as Record<string, unknown>
        
        // Validate timestamp exists and is a valid number
        if (
            !('timestamp' in storedData) ||
            typeof storedData.timestamp !== 'number' ||
            !Number.isFinite(storedData.timestamp) ||
            storedData.timestamp <= 0
        ) {
            console.warn(`Invalid timestamp in stored data for key: ${key}`)
            localStorage.removeItem(key)
            return null
        }
        
        // Validate data property exists
        if (!('data' in storedData)) {
            console.warn(`Missing data property in stored data for key: ${key}`)
            localStorage.removeItem(key)
            return null
        }
        
        // Check if data has expired
        if (isExpired(storedData.timestamp)) {
            localStorage.removeItem(key)
            return null
        }

        return storedData.data as T
    } catch (error) {
        // Remove corrupted data
        console.warn(`Failed to parse stored data for key: ${key}`, error)
        try {
            localStorage.removeItem(key)
        } catch {
            // Ignore removal errors
        }
        return null
    }
}

/**
 * Safe localStorage setter with error handling and quota management
 */
function safeSetItem<T>(key: string, data: T): boolean {
    if (!isBrowser()) return false

    try {
        const size = getDataSize(data)
        
        // Check if data exceeds max size
        if (size > MAX_STORAGE_SIZE) {
            console.warn(`Data for ${key} exceeds max storage size (${size} > ${MAX_STORAGE_SIZE})`)
            return false
        }

        const stored: StoredData<T> = {
            data,
            timestamp: Date.now(),
        }

        localStorage.setItem(key, JSON.stringify(stored))
        return true
    } catch (error) {
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
            console.warn("localStorage quota exceeded, clearing old demo data")
            clearAllDemoData()
            // Retry once after clearing
            try {
                const stored: StoredData<T> = {
                    data,
                    timestamp: Date.now(),
                }
                localStorage.setItem(key, JSON.stringify(stored))
                return true
            } catch {
                return false
            }
        }
        return false
    }
}

/**
 * Clear all demo data from localStorage
 */
export function clearAllDemoData(): void {
    if (!isBrowser()) return

    try {
        Object.values(STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key)
        })
    } catch {
        // Ignore errors
    }
}

// ============================================================================
// Transaction Storage
// ============================================================================

export function getStoredTransactions(): TransactionWithAI[] | null {
    return safeGetItem<TransactionWithAI[]>(STORAGE_KEYS.transactions)
}

export function setStoredTransactions(transactions: TransactionWithAI[]): boolean {
    return safeSetItem(STORAGE_KEYS.transactions, transactions)
}

export function updateStoredTransaction(
    id: string,
    updates: Partial<TransactionWithAI>
): boolean {
    const transactions = getStoredTransactions()
    if (!transactions) return false

    const updated = transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
    )
    return setStoredTransactions(updated)
}

export function deleteStoredTransaction(id: string): boolean {
    const transactions = getStoredTransactions()
    if (!transactions) return false

    const filtered = transactions.filter((t) => t.id !== id)
    return setStoredTransactions(filtered)
}

export function addStoredTransaction(transaction: TransactionWithAI): boolean {
    const transactions = getStoredTransactions() ?? []
    return setStoredTransactions([...transactions, transaction])
}

// ============================================================================
// Invoice Storage
// ============================================================================

export function getStoredInvoices(): Invoice[] | null {
    return safeGetItem<Invoice[]>(STORAGE_KEYS.invoices)
}

export function setStoredInvoices(invoices: Invoice[]): boolean {
    return safeSetItem(STORAGE_KEYS.invoices, invoices)
}

export function updateStoredInvoice(id: string, updates: Partial<Invoice>): boolean {
    const invoices = getStoredInvoices()
    if (!invoices) return false

    const updated = invoices.map((i) =>
        i.id === id ? { ...i, ...updates } : i
    )
    return setStoredInvoices(updated)
}

export function deleteStoredInvoice(id: string): boolean {
    const invoices = getStoredInvoices()
    if (!invoices) return false

    const filtered = invoices.filter((i) => i.id !== id)
    return setStoredInvoices(filtered)
}

export function addStoredInvoice(invoice: Invoice): boolean {
    const invoices = getStoredInvoices() ?? []
    return setStoredInvoices([...invoices, invoice])
}

// ============================================================================
// Receipt Storage
// ============================================================================

export function getStoredReceipts(): Receipt[] | null {
    return safeGetItem<Receipt[]>(STORAGE_KEYS.receipts)
}

export function setStoredReceipts(receipts: Receipt[]): boolean {
    return safeSetItem(STORAGE_KEYS.receipts, receipts)
}

export function updateStoredReceipt(id: string, updates: Partial<Receipt>): boolean {
    const receipts = getStoredReceipts()
    if (!receipts) return false

    const updated = receipts.map((r) =>
        r.id === id ? { ...r, ...updates } : r
    )
    return setStoredReceipts(updated)
}

export function deleteStoredReceipt(id: string): boolean {
    const receipts = getStoredReceipts()
    if (!receipts) return false

    const filtered = receipts.filter((r) => r.id !== id)
    return setStoredReceipts(filtered)
}

export function addStoredReceipt(receipt: Receipt): boolean {
    const receipts = getStoredReceipts() ?? []
    return setStoredReceipts([...receipts, receipt])
}

// ============================================================================
// Metadata
// ============================================================================

export function getStorageMetadata(): StorageMetadata | null {
    return safeGetItem<StorageMetadata>(STORAGE_KEYS.metadata)
}

export function initializeStorage(): void {
    if (!isBrowser()) return

    const metadata = getStorageMetadata()
    if (!metadata) {
        const newMetadata: StorageMetadata = {
            version: 1,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
        }
        safeSetItem(STORAGE_KEYS.metadata, newMetadata)
    }
}

export function updateStorageMetadata(): void {
    const metadata = getStorageMetadata()
    if (metadata) {
        safeSetItem(STORAGE_KEYS.metadata, {
            ...metadata,
            lastUpdated: Date.now(),
        })
    }
}

// ============================================================================
// Storage Stats (for debugging/monitoring)
// ============================================================================

export interface StorageStats {
    totalSize: number
    transactionsSize: number
    invoicesSize: number
    receiptsSize: number
    transactionsCount: number
    invoicesCount: number
    receiptsCount: number
    isExpired: boolean
    metadata: StorageMetadata | null
}

export function getStorageStats(): StorageStats | null {
    if (!isBrowser()) return null

    const transactions = getStoredTransactions()
    const invoices = getStoredInvoices()
    const receipts = getStoredReceipts()
    const metadata = getStorageMetadata()

    const transactionsSize = transactions ? getDataSize(transactions) : 0
    const invoicesSize = invoices ? getDataSize(invoices) : 0
    const receiptsSize = receipts ? getDataSize(receipts) : 0

    return {
        totalSize: transactionsSize + invoicesSize + receiptsSize,
        transactionsSize,
        invoicesSize,
        receiptsSize,
        transactionsCount: transactions?.length ?? 0,
        invoicesCount: invoices?.length ?? 0,
        receiptsCount: receipts?.length ?? 0,
        isExpired: metadata ? isExpired(metadata.lastUpdated) : true,
        metadata,
    }
}
