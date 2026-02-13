/**
 * Förmåner (Employee Benefits) Data Layer
 * 
 * Supabase-backed operations for managing employee benefits.
 * Includes catalog of all Swedish benefits and assignment tracking.
 */

import { getSupabaseClient, isSupabaseConfigured } from './database/supabase'
import type {
    FormanCatalogItem,
    EmployeeBenefit,
    AssignBenefitInput,
    BenefitTaxImpact,
    BenefitCategory,
} from './ai/tool-types'
import { formanerCatalog } from './ai/reference-data'
import { taxService, FALLBACK_TAX_RATES } from '@/services/tax-service'

// =============================================================================
// Database Row Types
// =============================================================================

interface FormanCatalogRow {
    id: string
    name: string
    category: BenefitCategory
    max_amount?: number
    tax_free: boolean
    formansvarde_calculation?: string
    description?: string
    rules?: Record<string, unknown>
    bas_account?: string
}

interface EmployeeBenefitRow {
    id: string
    company_id: string
    employee_name: string
    benefit_type: string
    amount: number | string
    year: number
    month?: number
    formansvarde?: number | string
    notes?: string
    created_at: string
}

// =============================================================================
// Catalog Operations
// =============================================================================

/**
 * List all available benefits from catalog
 * Falls back to static data if Supabase not configured
 */
export async function listAvailableBenefits(
    companyType?: 'AB' | 'EF' | 'EnskildFirma'
): Promise<FormanCatalogItem[]> {
    // Try Supabase first
    if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase
            .from('formaner_catalog' as any)
            .select('*')
            .order('name')

        if (!error && data?.length) {
            const mapped = (data as unknown as FormanCatalogRow[]).map(mapCatalogFromDb)
            return filterByCompanyType(mapped, companyType)
        }
    }

    // Fallback to static catalog
    return filterByCompanyType(formanerCatalog, companyType)
}

/**
 * Get a specific benefit by ID
 */
export async function getBenefitDetails(id: string): Promise<FormanCatalogItem | null> {
    if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase
            .from('formaner_catalog' as any)
            .select('*')
            .eq('id', id)
            .single()

        if (data) return mapCatalogFromDb(data as unknown as FormanCatalogRow)
    }

    // Fallback
    return formanerCatalog.find(b => b.id === id) || null
}

/**
 * List benefits by category
 */
export async function listBenefitsByCategory(
    category: BenefitCategory
): Promise<FormanCatalogItem[]> {
    const all = await listAvailableBenefits()
    return all.filter(b => b.category === category)
}

// =============================================================================
// Employee Benefit Assignment
// =============================================================================

/**
 * Assign a benefit to an employee
 */
export async function assignBenefit(
    input: AssignBenefitInput
): Promise<EmployeeBenefit | null> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured')
        return null
    }

    // Calculate förmånsvärde if applicable
    const benefit = await getBenefitDetails(input.benefitType)
    const formansvarde = benefit?.taxFree ? 0 : calculateFormansvarde(input.benefitType, input.amount)

    const supabase = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('employee_benefits' as any)
        .insert({
            employee_name: input.employeeName,
            benefit_type: input.benefitType,
            amount: input.amount,
            year: input.year,
            month: input.month,
            formansvarde: formansvarde,
            notes: input.notes,
        })
        .select()
        .single()

    if (error) {
        console.error('Error assigning benefit:', error)
        return null
    }

    return mapBenefitFromDb(data as unknown as EmployeeBenefitRow)
}

/**
 * Get all benefits assigned to an employee for a year
 */
export async function getEmployeeBenefits(
    employeeName: string,
    year: number
): Promise<EmployeeBenefit[]> {
    if (!isSupabaseConfigured()) return []

    const supabase = getSupabaseClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('employee_benefits' as any)
        .select('*')
        .eq('employee_name', employeeName)
        .eq('year', year)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching employee benefits:', error)
        return []
    }

    return ((data || []) as unknown as EmployeeBenefitRow[]).map(mapBenefitFromDb)
}

/**
 * Get remaining allowance for a benefit (e.g., friskvård)
 */
export async function getRemainingAllowance(
    employeeName: string,
    benefitType: string,
    year: number
): Promise<number> {
    const benefit = await getBenefitDetails(benefitType)
    if (!benefit?.maxAmount) return Infinity // No limit

    const used = await getEmployeeBenefits(employeeName, year)
    const usedAmount = used
        .filter(b => b.benefitType === benefitType)
        .reduce((sum, b) => sum + b.amount, 0)

    return Math.max(0, benefit.maxAmount - usedAmount)
}

/**
 * Suggest unused benefits for an employee
 */
export async function suggestUnusedBenefits(
    employeeName: string,
    year: number,
    companyType: 'AB' | 'EF' | 'EnskildFirma' = 'AB'
): Promise<FormanCatalogItem[]> {
    const available = await listAvailableBenefits(companyType)
    const used = await getEmployeeBenefits(employeeName, year)
    const usedTypes = new Set(used.map(b => b.benefitType))

    // Return tax-free benefits not yet used
    return available.filter(b =>
        b.taxFree &&
        !usedTypes.has(b.id) &&
        b.maxAmount // Only suggest benefits with clear limits
    )
}

// =============================================================================
// Tax Calculations
// =============================================================================

/**
 * Calculate the tax impact of a benefit
 */
export async function calculateBenefitTaxImpact(
    benefitType: string,
    amount: number
): Promise<BenefitTaxImpact> {
    const benefit = await getBenefitDetails(benefitType)
    const taxFree = benefit?.taxFree ?? false
    const formansvarde = taxFree ? 0 : calculateFormansvarde(benefitType, amount)

    // Fetch current rates (with fallback)
    const currentYear = new Date().getFullYear()
    let employerFeesRate = FALLBACK_TAX_RATES.employerContributionRate
    try {
        const rates = await taxService.getAllTaxRates(currentYear)
        employerFeesRate = rates.employerContributionRate
    } catch { /* use fallback */ }
    const employeeTaxRate = 0.32 // Marginal rate (varies per individual, approximate)

    const employeeTax = formansvarde * employeeTaxRate
    const employerFees = taxFree ? 0 : formansvarde * employerFeesRate
    const netCost = amount + employerFees

    return {
        benefitType,
        amount,
        taxFree,
        formansvarde,
        employeeTax,
        employerFees,
        netCost,
    }
}

/**
 * Calculate förmånsvärde for taxable benefits.
 * Uses cached rates when available, falls back to constants.
 */
function calculateFormansvarde(benefitType: string, amount: number, rates?: { formansvardeKost: number; formansvardeLunch: number }): number {
    const kostRate = rates?.formansvardeKost ?? FALLBACK_TAX_RATES.formansvardeKost
    const lunchRate = rates?.formansvardeLunch ?? FALLBACK_TAX_RATES.formansvardeLunch

    switch (benefitType) {
        case 'kost':
            return kostRate
        case 'lunch':
            return lunchRate
        case 'drivmedel':
            return amount * 1.2 // 120% of market price
        case 'tjanstebil':
            return amount
        default:
            return amount
    }
}

// =============================================================================
// Helpers
// =============================================================================

function filterByCompanyType(
    benefits: FormanCatalogItem[],
    companyType?: 'AB' | 'EF' | 'EnskildFirma'
): FormanCatalogItem[] {
    if (!companyType) return benefits

    return benefits.filter(b => {
        if (!b.rules) return true
        return b.rules[companyType] !== false
    })
}

// function mapCatalogFromDb(row: any): FormanCatalogItem {
function mapCatalogFromDb(row: FormanCatalogRow): FormanCatalogItem {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        maxAmount: row.max_amount ? Number(row.max_amount) : undefined,
        taxFree: row.tax_free,
        formansvardeCalculation: row.formansvarde_calculation,
        description: row.description,
        rules: row.rules,
        basAccount: row.bas_account,
    }
}

function mapBenefitFromDb(row: EmployeeBenefitRow): EmployeeBenefit {
    return {
        id: row.id,
        companyId: row.company_id,
        employeeName: row.employee_name,
        benefitType: row.benefit_type,
        amount: Number(row.amount),
        year: row.year,
        month: row.month,
        formansvarde: row.formansvarde ? Number(row.formansvarde) : undefined,
        notes: row.notes,
        createdAt: new Date(row.created_at),
    }
}
