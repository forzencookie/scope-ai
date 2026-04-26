import { defineTool } from '../registry'
import { payrollService, type Employee } from '@/services/payroll'
import { taxService } from '@/services/tax'
import { calculateEmployerContributions } from '@/services/accounting'

export interface EmployerContributionsParams {
    month?: string
    employeeIds?: string[]
}

export interface EmployeeContributionBreakdown {
    id: string
    name: string
    grossSalary: number
    employerContributionRate: number
    employerContribution: number
}

export interface EmployerContributionsResult {
    month: string
    employees: EmployeeContributionBreakdown[]
    totalGross: number
    totalEmployerContributions: number
    contributionRate: number
}

export const calculateEmployerContributionsTool = defineTool<
    EmployerContributionsParams,
    EmployerContributionsResult
>({
    name: 'calculate_employer_contributions',
    description: 'Beräknar arbetsgivaravgifter för en lönemånad. Visar underlag per anställd och totalt skatteunderlag för AGI.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['arbetsgivaravgift', 'AGI', 'arbetsgivardeklaration', 'skatteunderlag', 'lönesumma'],
    parameters: {
        type: 'object',
        properties: {
            month: { type: 'string', description: 'Månad i formatet YYYY-MM (standard: aktuell månad)' },
            employeeIds: { type: 'array', items: { type: 'string' }, description: 'Valfritt filter på anställda (standard: alla aktiva)' },
        },
    },
    execute: async (params) => {
        const now = new Date()
        const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const year = parseInt(month.split('-')[0]) || now.getFullYear()

        const [allEmployees, rates] = await Promise.all([
            payrollService.getEmployees(),
            taxService.getAllTaxRates(year),
        ])

        if (!rates) {
            return { success: false, error: `Skattesatser för ${year} saknas — kan inte beräkna arbetsgivaravgifter.` }
        }

        let employees: Employee[] = allEmployees.filter(e => e.status === 'Aktiv')
        if (params.employeeIds && params.employeeIds.length > 0) {
            employees = employees.filter(e => params.employeeIds!.includes(e.id))
        }

        const contributionRate = rates.employerContributionRate
        const breakdown: EmployeeContributionBreakdown[] = employees.map(emp => {
            const gross = emp.monthlySalary ?? 0
            return {
                id: emp.id,
                name: emp.name,
                grossSalary: gross,
                employerContributionRate: contributionRate,
                employerContribution: calculateEmployerContributions(gross, contributionRate),
            }
        })

        const totalGross = breakdown.reduce((sum, e) => sum + e.grossSalary, 0)
        const totalEmployerContributions = breakdown.reduce((sum, e) => sum + e.employerContribution, 0)

        return {
            success: true,
            data: { month, employees: breakdown, totalGross, totalEmployerContributions, contributionRate },
            message: `Arbetsgivaravgifter ${month}: ${breakdown.length} anställda, total bruttolön ${totalGross.toLocaleString('sv-SE')} kr, arbetsgivaravgifter ${totalEmployerContributions.toLocaleString('sv-SE')} kr (${(contributionRate * 100).toFixed(2)} %).`,
        }
    },
})

export const employerContributionsTools = [calculateEmployerContributionsTool]
