import { getSupabaseClient } from '@/lib/database/supabase'

export type Benefit = {
    id: string
    name: string
    description?: string
    category: 'health' | 'pension' | 'wellness' | 'transport' | 'meal' | 'other'
    valuePerMonth: number
    isTaxable: boolean
    taxValue: number
    provider?: string
    isActive: boolean
}

export type EmployeeBenefit = {
    id: string
    employeeId: string
    benefitId: string
    benefitName: string
    startDate?: string
    endDate?: string
}

export type BenefitStats = {
    totalCost: number
    employeesWithBenefits: number
    totalEmployees: number
    unusedPotential: number
    totalBenefits: number
    activeBenefits: number
}

export const benefitService = {
    /**
     * Get aggregate statistics for benefits for a specific year
     */
    async getStats(year: number): Promise<BenefitStats> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('get_benefit_stats', { target_year: year }) as { data: any, error: any }

        if (error) {
            console.error('Failed to fetch benefit stats:', error)
            return {
                totalCost: 0,
                employeesWithBenefits: 0,
                totalEmployees: 10,
                unusedPotential: 0,
                totalBenefits: 0,
                activeBenefits: 0,
            }
        }

        return {
            totalCost: Number(data.totalValue || data.totalCost || 0),
            employeesWithBenefits: Number(data.employeesWithBenefits || 0),
            totalEmployees: Number(data.totalEmployees || 10),
            unusedPotential: Number(data.unusedPotential || 0),
            totalBenefits: Number(data.totalBenefits || 0),
            activeBenefits: Number(data.activeBenefits || 0),
        }
    },

    /**
     * Get all available benefits.
     */
    async getBenefits(): Promise<Benefit[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('benefits' as any)
            .select('*')
            .order('category')

        if (error) {
            console.error('Failed to fetch benefits:', error)
            return []
        }

        return (data || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            category: b.category || 'other',
            valuePerMonth: Number(b.value_per_month) || 0,
            isTaxable: b.is_taxable || false,
            taxValue: Number(b.tax_value) || 0,
            provider: b.provider,
            isActive: b.is_active !== false,
        }))
    },

    /**
     * Get benefits assigned to an employee.
     */
    async getEmployeeBenefits(employeeId: string): Promise<EmployeeBenefit[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('employee_benefits' as any)
            .select('*, benefits(name)')
            .eq('employee_id', employeeId)

        if (error) {
            console.error('Failed to fetch employee benefits:', error)
            return []
        }

        return (data || []).map((eb: any) => ({
            id: eb.id,
            employeeId: eb.employee_id,
            benefitId: eb.benefit_id,
            benefitName: eb.benefits?.name || 'Okänd förmån',
            startDate: eb.start_date,
            endDate: eb.end_date,
        }))
    },
}
