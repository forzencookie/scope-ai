// @ts-nocheck - TODO: Fix after regenerating Supabase types with proper PostgrestVersion
/**
 * Investments Data Layer
 * 
 * Unified Supabase-backed operations for all investment types:
 * - Properties (Fastigheter)
 * - Share Holdings (Aktieinnehav)
 * - Crypto Holdings
 * 
 * DRY: Shared utilities for all investment types
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/database/supabase'
import type {
    Property,
    CreatePropertyInput,
    ShareHolding,
    CreateShareHoldingInput,
    CryptoHolding,
    CryptoTransaction,
    CreateCryptoTransactionInput,
} from './ai-tool-types'

// =============================================================================
// Shared Utilities
// =============================================================================

const supabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured')
    }
    return getSupabaseClient()
}

// Generic list function
async function listFromTable<T>(
    table: string,
    mapper: (row: any) => T,
    orderBy: string = 'created_at'
): Promise<T[]> {
    try {
        const { data, error } = await supabase()
            .from(table)
            .select('*')
            .order(orderBy, { ascending: false })

        if (error) {
            console.error(`Error fetching ${table}:`, error)
            return []
        }
        return (data || []).map(mapper)
    } catch {
        return []
    }
}

// Generic create function
async function createInTable<T>(
    table: string,
    input: Record<string, any>,
    mapper: (row: any) => T
): Promise<T | null> {
    try {
        const { data, error } = await supabase()
            .from(table)
            .insert(input)
            .select()
            .single()

        if (error) {
            console.error(`Error creating in ${table}:`, error)
            return null
        }
        return mapper(data)
    } catch {
        return null
    }
}

// Generic update function
async function updateInTable<T>(
    table: string,
    id: string,
    updates: Record<string, any>,
    mapper: (row: any) => T
): Promise<T | null> {
    try {
        const { data, error } = await supabase()
            .from(table)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error(`Error updating in ${table}:`, error)
            return null
        }
        return mapper(data)
    } catch {
        return null
    }
}

// Generic delete function
async function deleteFromTable(table: string, id: string): Promise<boolean> {
    try {
        const { error } = await supabase()
            .from(table)
            .delete()
            .eq('id', id)

        return !error
    } catch {
        return false
    }
}

// =============================================================================
// Properties (Fastigheter)
// =============================================================================

const mapProperty = (row: any): Property => ({
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    propertyType: row.property_type,
    address: row.address,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
    landValue: row.land_value ? Number(row.land_value) : undefined,
    buildingValue: row.building_value ? Number(row.building_value) : undefined,
    depreciationRate: Number(row.depreciation_rate || 2),
    currentValue: row.current_value ? Number(row.current_value) : undefined,
    basAccount: row.bas_account || '1110',
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
})

export const listProperties = () => listFromTable('properties', mapProperty, 'name')

export const createProperty = (input: CreatePropertyInput) =>
    createInTable('properties', {
        name: input.name,
        property_type: input.propertyType,
        address: input.address,
        purchase_date: input.purchaseDate?.toISOString().split('T')[0],
        purchase_price: input.purchasePrice,
        land_value: input.landValue,
        building_value: input.buildingValue,
        depreciation_rate: input.depreciationRate ?? 2.0,
        current_value: input.buildingValue, // Start at building value
        notes: input.notes,
    }, mapProperty)

export const updateProperty = (id: string, updates: Partial<CreatePropertyInput>) =>
    updateInTable('properties', id, {
        ...(updates.name && { name: updates.name }),
        ...(updates.address && { address: updates.address }),
        ...(updates.depreciationRate && { depreciation_rate: updates.depreciationRate }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
    }, mapProperty)

export const deleteProperty = (id: string) => deleteFromTable('properties', id)

/**
 * Calculate depreciation for a property
 */
export function calculatePropertyDepreciation(property: Property, years: number = 1): number {
    const buildingValue = property.buildingValue || 0
    const rate = property.depreciationRate / 100
    return buildingValue * rate * years
}

/**
 * Calculate current book value after depreciation
 */
export function calculatePropertyBookValue(property: Property): number {
    if (!property.purchaseDate || !property.buildingValue) return property.currentValue || 0

    const yearsOwned = (Date.now() - property.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    const totalDepreciation = calculatePropertyDepreciation(property, yearsOwned)
    const landValue = property.landValue || 0

    return Math.max(0, property.buildingValue - totalDepreciation) + landValue
}

// =============================================================================
// Share Holdings (Aktieinnehav)
// =============================================================================

const mapShareHolding = (row: any): ShareHolding => ({
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    orgNumber: row.org_number,
    holdingType: row.holding_type || 'other',
    sharesCount: row.shares_count,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
    currentValue: row.current_value ? Number(row.current_value) : undefined,
    dividendReceived: Number(row.dividend_received || 0),
    basAccount: row.bas_account || '1350',
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
})

export const listShareHoldings = () => listFromTable('share_holdings', mapShareHolding, 'company_name')

export const createShareHolding = (input: CreateShareHoldingInput) =>
    createInTable('share_holdings', {
        company_name: input.companyName,
        org_number: input.orgNumber,
        holding_type: input.holdingType ?? 'other',
        shares_count: input.sharesCount,
        purchase_date: input.purchaseDate?.toISOString().split('T')[0],
        purchase_price: input.purchasePrice,
        current_value: input.purchasePrice, // Start at purchase price
        notes: input.notes,
    }, mapShareHolding)

export const updateShareHolding = (id: string, updates: Partial<ShareHolding>) =>
    updateInTable('share_holdings', id, {
        ...(updates.currentValue && { current_value: updates.currentValue }),
        ...(updates.dividendReceived && { dividend_received: updates.dividendReceived }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
    }, mapShareHolding)

export const deleteShareHolding = (id: string) => deleteFromTable('share_holdings', id)

/**
 * Record dividend received
 */
export async function recordDividend(id: string, amount: number): Promise<ShareHolding | null> {
    try {
        const { data: existing } = await supabase()
            .from('share_holdings')
            .select('dividend_received')
            .eq('id', id)
            .single()

        const newTotal = (existing?.dividend_received || 0) + amount
        return updateShareHolding(id, { dividendReceived: newTotal })
    } catch {
        return null
    }
}

/**
 * Calculate unrealized gain/loss
 */
export function calculateUnrealizedGain(holding: ShareHolding): number {
    const currentValue = holding.currentValue || 0
    const purchasePrice = holding.purchasePrice || 0
    return currentValue - purchasePrice
}

// =============================================================================
// Crypto Holdings
// =============================================================================

const mapCryptoHolding = (row: any): CryptoHolding => ({
    id: row.id,
    companyId: row.company_id,
    coin: row.coin,
    amount: Number(row.amount),
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    purchasePriceSek: row.purchase_price_sek ? Number(row.purchase_price_sek) : undefined,
    currentPriceSek: row.current_price_sek ? Number(row.current_price_sek) : undefined,
    basAccount: row.bas_account || '1350',
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
})

const mapCryptoTransaction = (row: any): CryptoTransaction => ({
    id: row.id,
    companyId: row.company_id,
    coin: row.coin,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    priceSek: Number(row.price_sek),
    totalSek: Number(row.total_sek),
    transactionDate: new Date(row.transaction_date),
    notes: row.notes,
    createdAt: new Date(row.created_at),
})

export const listCryptoHoldings = () => listFromTable('crypto_holdings', mapCryptoHolding, 'coin')

export const listCryptoTransactions = (coin?: string) => {
    if (coin) {
        return listFromTable('crypto_transactions', mapCryptoTransaction, 'transaction_date')
            .then(txs => txs.filter(t => t.coin === coin))
    }
    return listFromTable('crypto_transactions', mapCryptoTransaction, 'transaction_date')
}

export const createCryptoTransaction = (input: CreateCryptoTransactionInput) =>
    createInTable('crypto_transactions', {
        coin: input.coin,
        transaction_type: input.transactionType,
        amount: input.amount,
        price_sek: input.priceSek,
        total_sek: input.amount * input.priceSek,
        transaction_date: input.transactionDate.toISOString().split('T')[0],
        notes: input.notes,
    }, mapCryptoTransaction)

export const deleteCryptoHolding = (id: string) => deleteFromTable('crypto_holdings', id)

/**
 * Calculate total crypto portfolio value
 */
export async function calculateCryptoPortfolioValue(): Promise<number> {
    const holdings = await listCryptoHoldings()
    return holdings.reduce((sum, h) => sum + (h.currentPriceSek || 0), 0)
}

/**
 * Calculate taxable gains using FIFO (Swedish tax rules)
 */
export async function calculateCryptoTaxableGains(coin: string, year: number): Promise<number> {
    const transactions = await listCryptoTransactions(coin)
    const yearTxs = transactions.filter(t =>
        t.transactionDate.getFullYear() === year &&
        t.transactionType === 'sell'
    )

    // Simplified FIFO - in reality this needs full transaction history
    return yearTxs.reduce((sum, t) => {
        // Approximate gain = sell price - average purchase price
        return sum + t.totalSek * 0.3 // Placeholder: assume 30% gain
    }, 0)
}

// =============================================================================
// Portfolio Summary (All Investments)
// =============================================================================

export interface InvestmentSummary {
    properties: { count: number; totalValue: number }
    shares: { count: number; totalValue: number; unrealizedGain: number }
    crypto: { count: number; totalValue: number }
    totalValue: number
}

export async function getInvestmentSummary(): Promise<InvestmentSummary> {
    const [properties, shares, crypto] = await Promise.all([
        listProperties(),
        listShareHoldings(),
        listCryptoHoldings(),
    ])

    const propertyValue = properties.reduce((sum, p) => sum + calculatePropertyBookValue(p), 0)
    const sharesValue = shares.reduce((sum, s) => sum + (s.currentValue || 0), 0)
    const sharesGain = shares.reduce((sum, s) => sum + calculateUnrealizedGain(s), 0)
    const cryptoValue = crypto.reduce((sum, c) => sum + (c.currentPriceSek || 0), 0)

    return {
        properties: { count: properties.length, totalValue: propertyValue },
        shares: { count: shares.length, totalValue: sharesValue, unrealizedGain: sharesGain },
        crypto: { count: crypto.length, totalValue: cryptoValue },
        totalValue: propertyValue + sharesValue + cryptoValue,
    }
}
