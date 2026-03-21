/**
 * Company Service (Shared/Client)
 * 
 * Manages company information in the database.
 * This file is safe to import in Client Components.
 */

import { createBrowserClient } from '@/lib/database/client'
import type { CompanyType } from '@/lib/company-types'

// Re-export for convenience
export type { CompanyType }

// =============================================================================
// Types
// =============================================================================

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
    hasFskatt: boolean
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
    hasFskatt?: boolean
    hasEmployees?: boolean
    hasMomsRegistration?: boolean
    shareCapital?: number
    totalShares?: number
}

// =============================================================================
// Database Row Mapping
// =============================================================================

export interface CompanyRow {
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
    has_f_skatt: boolean | null
    has_employees: boolean | null
    has_moms_registration: boolean | null
    share_capital: number | null
    total_shares: number | null
    settings: Record<string, unknown> | null
    created_at: string
    updated_at: string
    user_id: string
}

export function mapRowToCompany(row: CompanyRow): CompanyInfo {
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
        hasFskatt: row.has_f_skatt ?? true,
        hasEmployees: row.has_employees ?? false,
        hasMomsRegistration: row.has_moms_registration ?? true,
        shareCapital: row.share_capital ?? 0,
        totalShares: row.total_shares ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

// =============================================================================
// Client-safe Service Functions
// =============================================================================

/**
 * Get company info using client-side supabase (respects RLS)
 */
export async function getMyCompany(): Promise<CompanyInfo | null> {
    const supabase = createBrowserClient()

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
