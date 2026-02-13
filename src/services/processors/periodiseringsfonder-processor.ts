/**
 * Periodiseringsfonder Data Layer
 * 
 * Supabase-backed CRUD operations for tax allocation reserves.
 * AI tools call these functions to manage periodiseringsfonder.
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/database/supabase'
import type { Periodiseringsfond, CreatePeriodiseringsfondInput, TaxSavingsCalculation } from './ai-tool-types'
import { FALLBACK_TAX_RATES } from '@/services/tax-service'

// =============================================================================
// Database Row Types
// =============================================================================

interface PeriodiseringsfondRow {
    id: string
    company_id: string
    year: number
    amount: number | string
    dissolved_amount?: number | string
    expires_at: string
    status: 'active' | 'dissolved' | 'partially_dissolved'
    notes?: string
    created_at: string
    updated_at: string
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * List all periodiseringsfonder for the current company
 */
export async function listPeriodiseringsfonder(): Promise<Periodiseringsfond[]> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, returning empty array')
        return []
    }

    const supabase = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('periodiseringsfonder' as any)
        .select('*')
        .order('year', { ascending: false })

    if (error) {
        console.error('Error fetching periodiseringsfonder:', error)
        return []
    }

    return ((data || []) as unknown as PeriodiseringsfondRow[]).map(mapFromDb)
}

/**
 * Create a new periodiseringsfond
 */
export async function createPeriodiseringsfond(
    input: CreatePeriodiseringsfondInput
): Promise<Periodiseringsfond | null> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured')
        return null
    }

    // Calculate expiry date (6 years from end of tax year)
    const expiresAt = new Date(input.year + 6, 11, 31) // Dec 31, 6 years later

    const supabase = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('periodiseringsfonder' as any)
        .insert({
            year: input.year,
            amount: input.amount,
            expires_at: expiresAt.toISOString().split('T')[0],
            notes: input.notes,
            status: 'active',
            dissolved_amount: 0,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating periodiseringsfond:', error)
        return null
    }

    return mapFromDb(data as unknown as PeriodiseringsfondRow)
}

/**
 * Dissolve (or partially dissolve) a periodiseringsfond
 */
export async function dissolvePeriodiseringsfond(
    id: string,
    amount?: number // If not provided, dissolve fully
): Promise<Periodiseringsfond | null> {
    if (!isSupabaseConfigured()) {
        return null
    }

    const supabase = getSupabaseClient()

    // First get the current fond
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingData } = await supabase
        .from('periodiseringsfonder' as any)
        .select('*')
        .eq('id', id)
        .single()

    const existing = existingData as unknown as PeriodiseringsfondRow | null

    if (!existing) return null

    const existingAmount = Number(existing.amount)
    const existingDissolved = Number(existing.dissolved_amount || 0)
    const dissolveAmount = amount ?? (existingAmount - existingDissolved)
    const newDissolvedAmount = existingDissolved + dissolveAmount
    const newStatus = newDissolvedAmount >= existingAmount ? 'dissolved' : 'partially_dissolved'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('periodiseringsfonder' as any)
        .update({
            dissolved_amount: newDissolvedAmount,
            status: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error dissolving periodiseringsfond:', error)
        return null
    }

    return mapFromDb(data as unknown as PeriodiseringsfondRow)
}

/**
 * Get periodiseringsfonder expiring within N months
 */
export async function getExpiringFonder(withinMonths: number = 12): Promise<Periodiseringsfond[]> {
    if (!isSupabaseConfigured()) {
        return []
    }

    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + withinMonths)

    const supabase = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('periodiseringsfonder' as any)
        .select('*')
        .eq('status', 'active')
        .lte('expires_at', futureDate.toISOString().split('T')[0])
        .order('expires_at', { ascending: true })

    if (error) {
        console.error('Error fetching expiring fonder:', error)
        return []
    }

    return ((data || []) as unknown as PeriodiseringsfondRow[]).map(mapFromDb)
}

// =============================================================================
// Tax Calculations
// =============================================================================

/**
 * Calculate tax savings from creating a periodiseringsfond
 * @param amount Amount to set aside
 * @param companyType AB (25%, 20.6% tax) or EF/Enskild (30%, income tax)
 */
export function calculateTaxSavings(
    amount: number,
    companyType: 'AB' | 'EF' | 'EnskildFirma' = 'AB',
    year: number = new Date().getFullYear()
): TaxSavingsCalculation {
    // AB: Max 25% of profit, taxed at 20.6%
    // EF/Enskild: Max 30% of profit, taxed at marginal income tax
    const _maxPercentage = companyType === 'AB' ? 0.25 : 0.30
    const taxRate = companyType === 'AB' ? FALLBACK_TAX_RATES.corporateTaxRate : 0.32 // Approximate marginal rate for EF

    const taxSaved = amount * taxRate
    const expiresAt = new Date(year + 6, 11, 31)

    return {
        periodiseringsfondAmount: amount,
        taxRate,
        taxSaved,
        expiresAt,
    }
}

/**
 * Get total active periodiseringsfonder amount
 */
export async function getTotalActiveFonder(): Promise<number> {
    const fonder = await listPeriodiseringsfonder()
    return fonder
        .filter(f => f.status === 'active' || f.status === 'partially_dissolved')
        .reduce((sum, f) => sum + (f.amount - f.dissolvedAmount), 0)
}

// =============================================================================
// Helpers
// =============================================================================

function mapFromDb(row: PeriodiseringsfondRow): Periodiseringsfond {
    return {
        id: row.id,
        companyId: row.company_id,
        year: row.year,
        amount: Number(row.amount),
        dissolvedAmount: Number(row.dissolved_amount || 0),
        expiresAt: new Date(row.expires_at),
        status: row.status,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }
}
