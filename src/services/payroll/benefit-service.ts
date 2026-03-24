import { createBrowserClient } from '@/lib/database/client'
import { nullToUndefined } from '@/lib/utils'

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
        const supabase = createBrowserClient()
        const { data: rawData, error } = await supabase.rpc('get_benefit_stats', { target_year: year })
        const data = rawData as Record<string, unknown> | null

        if (error) {
            console.error('Failed to fetch benefit stats:', error)
            return {
                totalCost: 0,
                employeesWithBenefits: 0,
                totalEmployees: 0,
                unusedPotential: 0,
                totalBenefits: 0,
                activeBenefits: 0,
            }
        }

        const d = data ?? {}
        return {
            totalCost: Number(d.totalValue || d.totalCost || 0),
            employeesWithBenefits: Number(d.employeesWithBenefits || 0),
            totalEmployees: Number(d.totalEmployees || 0),
            unusedPotential: Number(d.unusedPotential || 0),
            totalBenefits: Number(d.totalBenefits || 0),
            activeBenefits: Number(d.activeBenefits || 0),
        }
    },

    /**
     * Get all available benefits.
     */
    async getBenefits(): Promise<Benefit[]> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('benefits')
            .select('*')
            .order('category')

        if (error) {
            console.error('Failed to fetch benefits:', error)
            return []
        }

        return (data || []).map((b): Benefit => ({
            id: b.id,
            name: b.name ?? 'Okänd förmån',
            description: undefined,
            category: (b.type || 'other') as Benefit['category'],
            valuePerMonth: Number(b.taxable_amount) || 0,
            isTaxable: (b.taxable_amount || 0) > 0,
            taxValue: Number(b.taxable_amount) || 0,
            provider: undefined,
            isActive: true,
        }))
    },

    /**
     * Get benefits assigned to an employee.
     */
    async getEmployeeBenefits(employeeId: string): Promise<EmployeeBenefit[]> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('benefits')
            .select('*')
            .eq('user_id', employeeId)

        if (error) {
            console.error('Failed to fetch employee benefits:', error)
            return []
        }

        return (data || []).map((eb): EmployeeBenefit => ({
            id: eb.id,
            employeeId: eb.user_id || employeeId,
            benefitId: eb.id,
            benefitName: eb.name ?? 'Okänd förmån',
            startDate: nullToUndefined(eb.created_at),
            endDate: nullToUndefined(eb.updated_at),
        }))
    },
}
