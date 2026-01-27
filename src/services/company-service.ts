/**
 * Company Service
 * 
 * Manages company information in the database.
 * This is the source of truth for company data - NOT localStorage.
 */

import { getSupabaseClient, getSupabaseAdmin } from '@/lib/database/supabase'

// =============================================================================
// Types
// =============================================================================

export type CompanyType = 'ab' | 'enskild_firma' | 'hb' | 'kb' | 'ekonomisk_forening'

export interface CompanyInfo {
    id: string
    name: string
    orgNumber: string | null
    companyType: CompanyType
    vatNumber: string | null
    address: string | null
    city: string | null
    zipCode: string | null
    email: string | null
    phone: string | null
    contactPerson: string | null
    registrationDate: string | null
    fiscalYearEnd: string // MM-DD format, e.g., "12-31"
    accountingMethod: 'cash' | 'invoice'
    vatFrequency: 'monthly' | 'quarterly' | 'annually'
    isCloselyHeld: boolean
    hasEmployees: boolean
    hasMomsRegistration: boolean
    shareCapital: number
    totalShares: number
    createdAt: string
    updatedAt: string
}

export interface CompanyUpdate {
    name?: string
    orgNumber?: string
    companyType?: CompanyType
    vatNumber?: string
    address?: string
    city?: string
    zipCode?: string
    email?: string
    phone?: string
    contactPerson?: string
    registrationDate?: string
    fiscalYearEnd?: string
    accountingMethod?: 'cash' | 'invoice'
    vatFrequency?: 'monthly' | 'quarterly' | 'annually'
    isCloselyHeld?: boolean
    hasEmployees?: boolean
    hasMomsRegistration?: boolean
    shareCapital?: number
    totalShares?: number
}

// =============================================================================
// Database Row Mapping
// =============================================================================

interface CompanyRow {
    id: string
    name: string
    org_number: string | null
    company_type: string | null
    vat_number: string | null
    address: string | null
    city: string | null
    zip_code: string | null
    email: string | null
    phone: string | null
    contact_person: string | null
    registration_date: string | null
    fiscal_year_end: string | null
    accounting_method: string | null
    vat_frequency: string | null
    is_closely_held: boolean | null
    has_employees: boolean | null
    has_moms_registration: boolean | null
    share_capital: number | null
    total_shares: number | null
    settings: Record<string, unknown> | null
    created_at: string
    updated_at: string
    user_id: string
}

function mapRowToCompany(row: CompanyRow): CompanyInfo {
    return {
        id: row.id,
        name: row.name,
        orgNumber: row.org_number,
        companyType: (row.company_type as CompanyType) || 'ab',
        vatNumber: row.vat_number,
        address: row.address,
        city: row.city,
        zipCode: row.zip_code,
        email: row.email,
        phone: row.phone,
        contactPerson: row.contact_person,
        registrationDate: row.registration_date,
        fiscalYearEnd: row.fiscal_year_end || '12-31',
        accountingMethod: (row.accounting_method as 'cash' | 'invoice') || 'invoice',
        vatFrequency: (row.vat_frequency as 'monthly' | 'quarterly' | 'annually') || 'quarterly',
        isCloselyHeld: row.is_closely_held ?? true,
        hasEmployees: row.has_employees ?? false,
        hasMomsRegistration: row.has_moms_registration ?? true,
        shareCapital: row.share_capital ?? 25000,
        totalShares: row.total_shares ?? 500,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get company info for a user (uses RLS)
 */
export async function getCompanyByUserId(userId: string): Promise<CompanyInfo | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned - user has no company yet
            return null
        }
        console.error('[CompanyService] Error fetching company:', error)
        return null
    }

    // Cast through unknown since DB types may not include new columns yet
    return mapRowToCompany(data as unknown as CompanyRow)
}

/**
 * Get company info using client-side supabase (respects RLS)
 */
export async function getMyCompany(): Promise<CompanyInfo | null> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return null
        }
        console.error('[CompanyService] Error fetching company:', error)
        return null
    }

    // Cast through unknown since DB types may not include new columns yet
    return mapRowToCompany(data as unknown as CompanyRow)
}

/**
 * Create a new company for a user
 */
export async function createCompany(
    userId: string,
    data: CompanyUpdate & { name: string }
): Promise<CompanyInfo | null> {
    const supabase = getSupabaseAdmin()

    const insertData = {
        user_id: userId,
        name: data.name,
        org_number: data.orgNumber || null,
        company_type: data.companyType || 'ab',
        vat_number: data.vatNumber || null,
        address: data.address || null,
        city: data.city || null,
        zip_code: data.zipCode || null,
        email: data.email || null,
        phone: data.phone || null,
        contact_person: data.contactPerson || null,
        registration_date: data.registrationDate || null,
        fiscal_year_end: data.fiscalYearEnd || '12-31',
        accounting_method: data.accountingMethod || 'invoice',
        vat_frequency: data.vatFrequency || 'quarterly',
        is_closely_held: data.isCloselyHeld ?? true,
        has_employees: data.hasEmployees ?? false,
        has_moms_registration: data.hasMomsRegistration ?? true,
        share_capital: data.shareCapital ?? 25000,
        total_shares: data.totalShares ?? 500,
    }

    const { data: result, error } = await supabase
        .from('companies')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error('[CompanyService] Error creating company:', error)
        return null
    }

    // Cast through unknown since DB types may not include new columns yet
    return mapRowToCompany(result as unknown as CompanyRow)
}

/**
 * Update company info
 */
export async function updateCompany(
    companyId: string,
    userId: string,
    updates: CompanyUpdate
): Promise<CompanyInfo | null> {
    const supabase = getSupabaseAdmin()

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    }

    // Map camelCase to snake_case
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.orgNumber !== undefined) updateData.org_number = updates.orgNumber
    if (updates.companyType !== undefined) updateData.company_type = updates.companyType
    if (updates.vatNumber !== undefined) updateData.vat_number = updates.vatNumber
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.city !== undefined) updateData.city = updates.city
    if (updates.zipCode !== undefined) updateData.zip_code = updates.zipCode
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson
    if (updates.registrationDate !== undefined) updateData.registration_date = updates.registrationDate
    if (updates.fiscalYearEnd !== undefined) updateData.fiscal_year_end = updates.fiscalYearEnd
    if (updates.accountingMethod !== undefined) updateData.accounting_method = updates.accountingMethod
    if (updates.vatFrequency !== undefined) updateData.vat_frequency = updates.vatFrequency
    if (updates.isCloselyHeld !== undefined) updateData.is_closely_held = updates.isCloselyHeld
    if (updates.hasEmployees !== undefined) updateData.has_employees = updates.hasEmployees
    if (updates.hasMomsRegistration !== undefined) updateData.has_moms_registration = updates.hasMomsRegistration
    if (updates.shareCapital !== undefined) updateData.share_capital = updates.shareCapital
    if (updates.totalShares !== undefined) updateData.total_shares = updates.totalShares

    const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        console.error('[CompanyService] Error updating company:', error)
        return null
    }

    // Cast through unknown since DB types may not include new columns yet
    return mapRowToCompany(data as unknown as CompanyRow)
}

/**
 * Upsert company (create or update)
 */
export async function upsertCompany(
    userId: string,
    data: CompanyUpdate & { name: string }
): Promise<CompanyInfo | null> {
    // Check if user already has a company
    const existing = await getCompanyByUserId(userId)

    if (existing) {
        return updateCompany(existing.id, userId, data)
    } else {
        return createCompany(userId, data)
    }
}

// =============================================================================
// Export Service Object
// =============================================================================

export const companyService = {
    getByUserId: getCompanyByUserId,
    getMyCompany,
    create: createCompany,
    update: updateCompany,
    upsert: upsertCompany,
}
