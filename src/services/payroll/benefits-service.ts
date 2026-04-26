/**
 * Benefits Service (Förmåner)
 *
 * Supabase-backed service for managing employee benefits.
 * Benefit rules and limits live in knowledge/accounting/formaner.md — read via read_skill.
 */

import { createBrowserClient, isSupabaseConfigured } from '@/lib/database/client'
import type {
    FormanCatalogItem,
    EmployeeBenefit,
    AssignBenefitInput,
    BenefitTaxImpact,
    BenefitCategory,
} from '@/types/benefits'
import { taxService } from '@/services/tax/tax-service'

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

export async function listAvailableBenefits(
    companyType?: 'AB' | 'EF' | 'EnskildFirma'
): Promise<FormanCatalogItem[]> {
    if (!isSupabaseConfigured()) return []

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('formaner_catalog')
        .select('*')
        .order('name')

    if (error || !data?.length) return []

    const mapped = (data as unknown as FormanCatalogRow[]).map(mapCatalogFromDb)
    return filterByCompanyType(mapped, companyType)
}

export async function getBenefitDetails(id: string): Promise<FormanCatalogItem | null> {
    if (!isSupabaseConfigured()) return null

    const supabase = createBrowserClient()
    const { data } = await supabase
        .from('formaner_catalog')
        .select('*')
        .eq('id', id)
        .single()

    if (data) return mapCatalogFromDb(data as unknown as FormanCatalogRow)
    return null
}

export async function listBenefitsByCategory(
    category: BenefitCategory
): Promise<FormanCatalogItem[]> {
    const all = await listAvailableBenefits()
    return all.filter(b => b.category === category)
}

// =============================================================================
// Employee Benefit Assignment
// =============================================================================

export async function assignBenefit(
    input: AssignBenefitInput
): Promise<EmployeeBenefit | null> {
    if (!isSupabaseConfigured()) return null

    const benefit = await getBenefitDetails(input.benefitType)
    const formansvarde = benefit?.taxFree ? 0 : calculateFormansvarde(input.benefitType, input.amount)

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('benefits')
        .insert({
            name: `${input.employeeName} — ${input.benefitType}`,
            type: input.benefitType,
            taxable_amount: formansvarde,
        })
        .select()
        .single()

    if (error) {
        console.error('Error assigning benefit:', error)
        return null
    }

    return mapBenefitFromDb(data as unknown as EmployeeBenefitRow)
}

export async function getEmployeeBenefits(
    employeeName: string,
    year: number
): Promise<EmployeeBenefit[]> {
    if (!isSupabaseConfigured()) return []

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .ilike('name', `${employeeName}%`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching employee benefits:', error)
        return []
    }

    return ((data || []) as unknown as EmployeeBenefitRow[]).map(mapBenefitFromDb)
}

export async function getAllAssignedBenefits(
    year: number
): Promise<EmployeeBenefit[]> {
    if (!isSupabaseConfigured()) return []

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all assigned benefits:', error)
        return []
    }

    return ((data || []) as unknown as EmployeeBenefitRow[]).map(mapBenefitFromDb)
}

export async function deleteAssignedBenefit(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false

    const supabase = createBrowserClient()
    const { error } = await supabase
        .from('benefits')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting assigned benefit:', error)
        return false
    }
    return true
}

// =============================================================================
// Allowance & Suggestions
// =============================================================================

async function getBenefitLimit(benefitType: string, year: number): Promise<number | null> {
    if (!isSupabaseConfigured()) return null

    const supabase = createBrowserClient()
    const { data } = await supabase
        .from('system_parameters')
        .select('value')
        .eq('key', `benefit_limit_${benefitType}`)
        .eq('year', year)
        .single()

    if (data?.value != null) return Number(data.value)

    const benefit = await getBenefitDetails(benefitType)
    return benefit?.maxAmount ?? null
}

export async function getRemainingAllowance(
    employeeName: string,
    benefitType: string,
    year: number
): Promise<number> {
    const limit = await getBenefitLimit(benefitType, year)
    if (limit == null) return Infinity

    const used = await getEmployeeBenefits(employeeName, year)
    const usedAmount = used
        .filter(b => b.benefitType === benefitType)
        .reduce((sum, b) => sum + b.amount, 0)

    return Math.max(0, limit - usedAmount)
}

export async function suggestUnusedBenefits(
    employeeName: string,
    year: number,
    companyType: 'AB' | 'EF' | 'EnskildFirma' = 'AB'
): Promise<FormanCatalogItem[]> {
    const available = await listAvailableBenefits(companyType)
    const used = await getEmployeeBenefits(employeeName, year)
    const usedTypes = new Set(used.map(b => b.benefitType))

    return available.filter(b =>
        b.taxFree &&
        !usedTypes.has(b.id) &&
        b.maxAmount
    )
}

// =============================================================================
// Tax Calculations
// =============================================================================

export async function calculateBenefitTaxImpact(
    benefitType: string,
    amount: number
): Promise<BenefitTaxImpact> {
    const benefit = await getBenefitDetails(benefitType)
    const taxFree = benefit?.taxFree ?? false

    const currentYear = new Date().getFullYear()
    const rates = await taxService.getAllTaxRates(currentYear)
    if (!rates) {
        throw new Error(`Skattesatser för ${currentYear} saknas — kan inte beräkna förmånsskatt.`)
    }

    const formansvarde = taxFree ? 0 : calculateFormansvarde(benefitType, amount, {
        formansvardeKost: 0,
        formansvardeLunch: 0,
        drivmedelFormansvardeMultiplier: rates.drivmedelFormansvardeMultiplier,
    })

    return {
        benefitType,
        amount,
        taxFree,
        formansvarde,
        employeeTax: formansvarde * rates.marginalTaxRateApprox,
        employerFees: taxFree ? 0 : formansvarde * rates.employerContributionRate,
        netCost: amount + (taxFree ? 0 : formansvarde * rates.employerContributionRate),
    }
}

// =============================================================================
// Private helpers
// =============================================================================

function calculateFormansvarde(
    benefitType: string,
    amount: number,
    rates?: { formansvardeKost: number; formansvardeLunch: number; drivmedelFormansvardeMultiplier?: number }
): number {
    const drivmedelMultiplier = rates?.drivmedelFormansvardeMultiplier ?? 1.2

    switch (benefitType) {
        case 'kost':    return rates?.formansvardeKost ?? 0
        case 'lunch':   return rates?.formansvardeLunch ?? 0
        case 'drivmedel': return amount * drivmedelMultiplier
        case 'tjanstebil': return amount
        default:        return amount
    }
}

function filterByCompanyType(
    benefits: FormanCatalogItem[],
    companyType?: 'AB' | 'EF' | 'EnskildFirma'
): FormanCatalogItem[] {
    if (!companyType) return benefits
    return benefits.filter(b => !b.rules || b.rules[companyType] !== false)
}

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
