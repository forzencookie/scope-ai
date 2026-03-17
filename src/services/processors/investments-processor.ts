/**
 * Investments Data Layer
 * 
 * Supabase-backed operations for share holdings (aktieinnehav).
 */

import { createBrowserClient, isSupabaseConfigured } from '@/lib/database/client'
import type {
    ShareHolding,
    CreateShareHoldingInput,
} from './ai-tool-types'
import type { Database } from '@/types/database'

type ShareholdingsRow = Database['public']['Tables']['shareholdings']['Row']
type ShareholdingsInsert = Database['public']['Tables']['shareholdings']['Insert']

// =============================================================================
// Shared Utilities
// =============================================================================

const supabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured')
    }
    return createBrowserClient()
}

// =============================================================================
// Share Holdings (Aktieinnehav)
// =============================================================================

const mapShareHolding = (row: ShareholdingsRow): ShareHolding => ({
    id: row.id,
    companyId: row.company_id || '',
    companyName: row.company_name || '',
    orgNumber: row.org_number || undefined,
    holdingType: (row.holding_type || 'other') as ShareHolding['holdingType'],
    sharesCount: row.shares_count || 0,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
    currentValue: row.current_value ? Number(row.current_value) : undefined,
    dividendReceived: Number(row.dividend_received || 0),
    basAccount: row.bas_account || '1350',
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at || ''),
    updatedAt: new Date(row.updated_at || ''),
})

export async function listShareHoldings(): Promise<ShareHolding[]> {
    try {
        const { data, error } = await supabase()
            .from('shareholdings')
            .select('*')
            .order('company_name', { ascending: false })

        if (error) {
            console.error('Error fetching shareholdings:', error)
            return []
        }
        return (data || []).map(mapShareHolding)
    } catch {
        return []
    }
}

export async function createShareHolding(input: CreateShareHoldingInput): Promise<ShareHolding | null> {
    try {
        const payload: ShareholdingsInsert = {
            company_name: input.companyName,
            org_number: input.orgNumber,
            holding_type: input.holdingType ?? 'other',
            shares_count: input.sharesCount,
            purchase_date: input.purchaseDate?.toISOString().split('T')[0],
            purchase_price: input.purchasePrice,
            current_value: input.purchasePrice,
            notes: input.notes,
        }
        const { data, error } = await supabase()
            .from('shareholdings')
            .insert(payload)
            .select()
            .single()

        if (error) {
            console.error('Error creating shareholding:', error)
            return null
        }
        return mapShareHolding(data)
    } catch {
        return null
    }
}

export async function updateShareHolding(id: string, updates: Partial<ShareHolding>): Promise<ShareHolding | null> {
    try {
        const payload: Database['public']['Tables']['shareholdings']['Update'] = {
            ...(updates.currentValue !== undefined && { current_value: updates.currentValue }),
            ...(updates.dividendReceived !== undefined && { dividend_received: updates.dividendReceived }),
            ...(updates.notes !== undefined && { notes: updates.notes }),
            updated_at: new Date().toISOString(),
        }
        const { data, error } = await supabase()
            .from('shareholdings')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating shareholding:', error)
            return null
        }
        return mapShareHolding(data)
    } catch {
        return null
    }
}

export async function deleteShareHolding(id: string): Promise<boolean> {
    try {
        const { error } = await supabase()
            .from('shareholdings')
            .delete()
            .eq('id', id)

        return !error
    } catch {
        return false
    }
}

/**
 * Record dividend received
 */
export async function recordDividend(id: string, amount: number): Promise<ShareHolding | null> {
    try {
        const { data: existing } = await supabase()
            .from('shareholdings')
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
