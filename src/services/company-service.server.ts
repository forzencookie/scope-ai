/**
 * Company Service (Server-only)
 * 
 * Manages company information in the database.
 * Use this in Server Components, Route Handlers, and Server Actions.
 */

import 'server-only'
import { createServerClient } from '@/lib/database/server'
import { 
    CompanyInfo, 
    CompanyUpdate, 
    CompanyRow, 
    mapRowToCompany 
} from './company-service'

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get company info for a user (uses RLS)
 */
export async function getCompanyByUserId(userId: string): Promise<CompanyInfo | null> {
    const supabase = await createServerClient()

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
 * Create a new company for a user
 */
export async function createCompany(
    userId: string,
    data: CompanyUpdate & { name: string }
): Promise<CompanyInfo | null> {
    const supabase = await createServerClient()

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
        has_f_skatt: data.hasFskatt ?? true,
        has_employees: data.hasEmployees ?? false,
        has_moms_registration: data.hasMomsRegistration ?? true,
        share_capital: data.shareCapital ?? null,
        total_shares: data.totalShares ?? null,
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
    const supabase = await createServerClient()

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
    if (updates.hasFskatt !== undefined) updateData.has_f_skatt = updates.hasFskatt
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
    create: createCompany,
    update: updateCompany,
    upsert: upsertCompany,
}
