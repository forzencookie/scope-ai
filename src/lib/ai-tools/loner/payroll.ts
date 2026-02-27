/**
 * Löner AI Tools - Payroll
 *
 * Tools for payroll management, salary calculations, and AGI submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { payrollService, type Payslip, type Employee, type AGIReport } from '@/services/payroll-service'
import { companyService } from '@/services/company-service'
import { taxService } from '@/services/tax-service'
import { getEmployeeBenefits } from '@/lib/formaner'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the monthly taxable benefit value (förmånsvärde) for an employee.
 * Benefits with a `month` field are already monthly; those without are yearly
 * and get divided by 12 to produce a monthly figure.
 */
async function getMonthlyBenefitValue(employeeName: string, year: number): Promise<number> {
    try {
        const empBenefits = await getEmployeeBenefits(employeeName, year)
        let total = 0
        for (const b of empBenefits) {
            if (!b.formansvarde || b.formansvarde <= 0) continue
            // If benefit has a month field, it's already a monthly value
            total += b.month ? b.formansvarde : b.formansvarde / 12
        }
        return Math.round(total)
    } catch {
        return 0
    }
}

// =============================================================================
// Payslip Tools
// =============================================================================

export interface GetPayslipsParams {
    period?: string
    employee?: string
}

export const getPayslipsTool = defineTool<GetPayslipsParams, Payslip[]>({
    name: 'get_payslips',
    description: 'Hämta genererade lönebesked för anställda. Kan filtrera på period eller person. Använd för att visa tidigare utbetalningar eller skapa underlag till AGI.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
            employee: { type: 'string', description: 'Namn på anställd' },
        },
    },
    execute: async (params) => {
        // Fetch real payslips using the service
        // Note: The service expects year/month numbers, but the AI tool gets string "December 2024".
        // For now, we'll fetch all and filter in memory, or parse the date.
        // Let's fetch all (default) and filter.
        let payslips = await payrollService.getPayslips()

        if (params.period) {
            payslips = payslips.filter(p => p.period.toLowerCase().includes(params.period!.toLowerCase()))
        }
        if (params.employee) {
            payslips = payslips.filter(p => p.employeeName.toLowerCase().includes(params.employee!.toLowerCase()))
        }

        return {
            success: true,
            data: payslips,
            message: `Hittade ${payslips.length} lönebesked.`,
        }
    },
})

export const getEmployeesTool = defineTool<Record<string, never>, Employee[]>({
    name: 'get_employees',
    description: 'Visa alla anställda med deras grundlön, anställningsform och roll. Använd för att få överblick eller inför lönekörning.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const employees = await payrollService.getEmployees()

        return {
            success: true,
            data: employees,
            message: `Du har ${employees.length} anställda.`,
        }
    },
})

// =============================================================================
// Run Payroll Tool
// =============================================================================

export interface RunPayrollParams {
    period: string
    employees?: string[]
}

export const runPayrollTool = defineTool<RunPayrollParams, Payslip[]>({
    name: 'run_payroll',
    description: 'Kör lönekörning för en månad. Beräknar nettolön, skatt och arbetsgivaravgifter. Skapar lönebesked för alla eller valda anställda. Vanliga frågor: "gör lönerna", "kör lönerna för mars", "betala ut löner". Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
            employees: { type: 'array', items: { type: 'string' }, description: 'Lista med anställda (standard: alla)' },
        },
        required: ['period'],
    },
    execute: async (params, context) => {
        // Fetch company info for display
        let companyName = ''
        let orgNumber = ''
        const userId = context?.userId
        if (userId) {
            try {
                const company = await companyService.getByUserId(userId)
                if (company) {
                    companyName = company.name
                    orgNumber = company.orgNumber || ''
                }
            } catch { /* use empty */ }
        }

        // Fetch real employees
        const realEmployees = await payrollService.getEmployees()
        let employees = [...realEmployees]

        if (params.employees && params.employees.length > 0) {
            employees = employees.filter(emp =>
                params.employees!.some(e => emp.name.toLowerCase().includes(e.toLowerCase()))
            )
        }

        // Calculate payslips from real employee data
        // Fetch tax rates and employee benefits for accurate employer contributions
        const currentYear = new Date().getFullYear()
        const rates = await taxService.getAllTaxRates(currentYear)
        if (!rates) {
            return { success: false, error: `Skattesatser för ${currentYear} saknas — kan inte beräkna löner.` }
        }

        const payslips: Payslip[] = []
        for (const emp of employees) {
            const gross = emp.monthlySalary || 0

            // Fetch monthly taxable benefit value for this employee
            const benefitTaxValue = await getMonthlyBenefitValue(emp.name, currentYear)

            // Taxable income = gross salary + taxable benefit value (SFL 11 kap)
            const taxableIncome = gross + benefitTaxValue

            // Look up tax deduction from SKV tables using employee's table number
            // Column 1 = standard (no church tax); fallback to approximate rate if no bracket found
            const tableNumber = emp.taxTable || 33
            const skvTax = await taxService.lookupTaxDeduction(currentYear, tableNumber, 1, taxableIncome)
            const tax = skvTax ?? Math.round(taxableIncome * rates.marginalTaxRateApprox)

            payslips.push({
                id: `new-${emp.id}`,
                period: params.period,
                employeeName: emp.name,
                employeeId: emp.id,
                year: currentYear,
                month: new Date().getMonth() + 1,
                grossSalary: gross,
                taxDeduction: tax,
                netSalary: gross - tax,
                bonuses: 0,
                otherDeductions: 0,
                status: 'draft',
                sentAt: undefined,
            })
        }

        const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0)
        const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0)
        const totalTax = payslips.reduce((sum, p) => sum + p.taxDeduction, 0)

        // If confirmed, persist all payslips to database
        if (context?.isConfirmed) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const savedPayslips: Payslip[] = []
            const errors: string[] = []
            const currentYear = new Date().getFullYear()
            const rates = await taxService.getAllTaxRates(currentYear)
            if (!rates) {
                return { success: false, error: `Skattesatser för ${currentYear} saknas — kan inte spara löner.` }
            }

            for (const payslip of payslips) {
                try {
                    // Include taxable benefits in employer contribution basis (SLF 2 kap 10§)
                    const benefitTaxValue = await getMonthlyBenefitValue(payslip.employeeName, currentYear)
                    const employerContributionBasis = payslip.grossSalary + benefitTaxValue
                    const employerContribution = Math.round(employerContributionBasis * rates.employerContributionRate)
                    const res = await fetch(`${baseUrl}/api/payroll/payslips`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employee_id: payslip.employeeId,
                            employee_name: payslip.employeeName,
                            period: payslip.period,
                            gross_salary: payslip.grossSalary,
                            tax_deduction: payslip.taxDeduction,
                            net_salary: payslip.netSalary,
                            employer_contributions: employerContribution,
                            employer_contribution_rate: rates.employerContributionRate,
                            bonuses: payslip.bonuses,
                            deductions: payslip.otherDeductions,
                            status: 'draft',
                            payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        }),
                    })

                    if (res.ok) {
                        const data = await res.json()
                        savedPayslips.push({ ...payslip, id: data.payslip?.id || payslip.id })
                    } else {
                        errors.push(`${payslip.employeeName}: Kunde inte spara`)
                    }
                } catch {
                    errors.push(`${payslip.employeeName}: Nätverksfel`)
                }
            }

            // Calculate vacation accrual suggestion (Semesterlagen 12%)
            const vacationAccrual = Math.round(totalGross * 0.12)
            const vacationNote = `\n\nSemesterlöneskuld på ${vacationAccrual.toLocaleString('sv-SE')} kr (12% av bruttolön) bör bokföras. Vill du att jag gör det?`

            return {
                success: errors.length === 0,
                data: savedPayslips,
                message: errors.length === 0
                    ? `Lönekörning klar! ${savedPayslips.length} lönebesked sparade. Total brutto: ${totalGross.toLocaleString('sv-SE')} kr.${vacationNote}`
                    : `${savedPayslips.length} av ${payslips.length} lönebesked sparade. Fel: ${errors.join('; ')}`,
                ...(errors.length > 0 ? { error: errors.join('; ') } : {}),
            }
        }

        // Preflight: return confirmation request
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Kör lönekörning',
            description: `Lönekörning för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Antal anställda', value: String(payslips.length) },
                { label: 'Total bruttolön', value: `${totalGross.toLocaleString('sv-SE')} kr` },
                { label: 'Total skatt', value: `${totalTax.toLocaleString('sv-SE')} kr` },
                { label: 'Total nettolön', value: `${totalNet.toLocaleString('sv-SE')} kr` },
            ],
            action: { toolName: 'run_payroll', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: payslips,
            message: `Lönekörning förberedd för ${payslips.length} anställda. Total: ${totalGross.toLocaleString('sv-SE')} kr. Bekräfta för att spara.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// ... (CalculateSalaryTool remains same)

// =============================================================================
// AGI Tools
// =============================================================================

export const getAGIReportsTool = defineTool<{ period?: string }, AGIReport[]>({
    name: 'get_agi_reports',
    description: 'Visa arbetsgivardeklarationer (AGI) som skickats eller är klara för inskickning. Innehåller summor för utbetald lön, skatt och arbetsgivaravgifter.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period att filtrera på (t.ex. "December 2024")' },
        },
    },
    execute: async (params) => {
        // Fetch real reports
        let reports = await payrollService.getAGIReports()

        if (params.period) {
            reports = reports.filter(r => r.period.toLowerCase().includes(params.period!.toLowerCase()))
        }

        if (reports.length === 0) {
            return {
                success: true,
                data: [],
                message: "Inga AGI-rapporter hittades.",
            }
        }

        const r = reports[0];

        // Sum monthly taxable benefits across all employees for AGI basis
        let totalMonthlyBenefits = 0
        try {
            const employees = await payrollService.getEmployees()
            const currentYear = new Date().getFullYear()
            for (const emp of employees) {
                totalMonthlyBenefits += await getMonthlyBenefitValue(emp.name, currentYear)
            }
        } catch { /* no benefits data */ }

        const totalGrossPay = r.totalSalary || 0
        const agiData = {
            period: r.period,
            employeeCount: r.employeeCount || 0,
            totalGrossPay,
            totalBenefits: totalMonthlyBenefits,
            totalTaxDeduction: r.totalTax || 0,
            employerFeeBasis: totalGrossPay + totalMonthlyBenefits,
            totalEmployerFee: r.employerContributions || 0,
        }

        return {
            success: true,
            data: reports,
            message: `Hittade ${reports.length} AGI-rapporter. Senaste: Skatt ${r.totalTax.toLocaleString('sv-SE')} kr, arbetsgivaravgifter ${r.employerContributions.toLocaleString('sv-SE')} kr.`,
        }
    },
})

export interface SubmitAGIParams {
    period: string
}

export const submitAGITool = defineTool<SubmitAGIParams, { submitted: boolean; referenceNumber: string }>({
    name: 'submit_agi_declaration',
    description: 'Skicka arbetsgivardeklaration (AGI) till Skatteverket. Innehåller alla löner och skatteavdrag för perioden. Deadline: 12:e varje månad. Vanliga frågor: "skicka AGI", "skicka in löneuppgifter". Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
        },
        required: ['period'],
    },
    execute: async (params) => {
        // Simulation, but using cleaner logic (no hardcoded totals)
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka AGI',
            description: `Arbetsgivardeklaration för ${params.period} (Simulering)`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Status', value: 'Simulering - Skickar till Skatteverket' },
            ],
            action: { toolName: 'submit_agi_declaration', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: { submitted: false, referenceNumber: '' },
            message: `AGI för ${params.period} förberedd för inskickning.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const payrollTools = [
    getPayslipsTool,
    getEmployeesTool,
    runPayrollTool,
    getAGIReportsTool,
    submitAGITool,
]
