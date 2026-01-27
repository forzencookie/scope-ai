/**
 * Investments Data Layer
 * 
 * Supabase-backed operations for share holdings (aktieinnehav).
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/database/supabase'
import type {
    ShareHolding,
    CreateShareHoldingInput,
} from './ai-tool-types'

// =============================================================================
// Database Row Types
// =============================================================================

interface ShareHoldingRow {
    id: string
    company_id: string
    company_name: string
    org_number?: string
    holding_type?: string
    shares_count: number
    purchase_date?: string
    purchase_price?: number
    current_value?: number
    dividend_received?: number
    bas_account?: string
    notes?: string
    created_at: string
    updated_at: string
}

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
async function listFromTable<TRow, TResult>(
    table: string,
    mapper: (row: TRow) => TResult,
    orderBy: string = 'created_at'
): Promise<TResult[]> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase()
            .from(table as any)
            .select('*')
            .order(orderBy, { ascending: false })

        if (error) {
            console.error(`Error fetching ${table}:`, error)
            return []
        }
        return ((data || []) as TRow[]).map(mapper)
    } catch {
        return []
    }
}

// Generic create function
async function createInTable<TRow, TResult>(
    table: string,
    input: Record<string, unknown>,
    mapper: (row: TRow) => TResult
): Promise<TResult | null> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase()
            .from(table as any)
            .insert(input)
            .select()
            .single()

        if (error) {
            console.error(`Error creating in ${table}:`, error)
            return null
        }
        return mapper(data as TRow)
    } catch {
        return null
    }
}

// Generic update function
async function updateInTable<TRow, TResult>(
    table: string,
    id: string,
    updates: Record<string, unknown>,
    mapper: (row: TRow) => TResult
): Promise<TResult | null> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase()
            .from(table as any)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error(`Error updating in ${table}:`, error)
            return null
        }
        return mapper(data as TRow)
    } catch {
        return null
    }
}

// Generic delete function
async function deleteFromTable(table: string, id: string): Promise<boolean> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase()
            .from(table as any)
            .delete()
            .eq('id', id)

        return !error
    } catch {
        return false
    }
}

// =============================================================================
// Share Holdings (Aktieinnehav)
// =============================================================================

const mapShareHolding = (row: ShareHoldingRow): ShareHolding => ({
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    orgNumber: row.org_number,
    holdingType: (row.holding_type || 'other') as ShareHolding['holdingType'],
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

export const listShareHoldings = () => 
    listFromTable<ShareHoldingRow, ShareHolding>('shareholdings', mapShareHolding, 'company_name')

export const createShareHolding = (input: CreateShareHoldingInput) =>
    createInTable<ShareHoldingRow, ShareHolding>('shareholdings', {
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
    updateInTable<ShareHoldingRow, ShareHolding>('shareholdings', id, {
        ...(updates.currentValue && { current_value: updates.currentValue }),
        ...(updates.dividendReceived && { dividend_received: updates.dividendReceived }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
    }, mapShareHolding)

export const deleteShareHolding = (id: string) => deleteFromTable('shareholdings', id)

/**
 * Record dividend received
 */
export async function recordDividend(id: string, amount: number): Promise<ShareHolding | null> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await supabase()
            .from('shareholdings' as any)
            .select('dividend_received')
            .eq('id', id)
            .single()

        const row = existing as { dividend_received?: number } | null
        const newTotal = (row?.dividend_received || 0) + amount
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
// Portfolio Summary
// =============================================================================

export interface InvestmentSummary {
    shares: { count: number; totalValue: number; unrealizedGain: number }
    totalValue: number
}

export async function getInvestmentSummary(): Promise<InvestmentSummary> {
    const shares = await listShareHoldings()

    const sharesValue = shares.reduce((sum, s) => sum + (s.currentValue || 0), 0)
    const sharesGain = shares.reduce((sum, s) => sum + calculateUnrealizedGain(s), 0)

    return {
        shares: { count: shares.length, totalValue: sharesValue, unrealizedGain: sharesGain },
        totalValue: sharesValue,
    }
}
