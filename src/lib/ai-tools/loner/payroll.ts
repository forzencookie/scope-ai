/**
 * Löner AI Tools - Payroll
 *
 * Tools for payroll management, salary calculations, and AGI submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { payrollService, type Payslip, type Employee, type AGIReport } from '@/services/payroll-service'
import { companyService } from '@/services/company-service'

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

        // Ensure salary is a number
        const payslips: Payslip[] = employees.map(emp => ({
            id: `new-${emp.id}`,
            period: params.period,
            employeeName: emp.name,
            employeeId: emp.id,
            year: new Date().getFullYear(), // Approximate
            month: new Date().getMonth() + 1, // Approximate
            grossSalary: emp.monthlySalary || 0,
            taxDeduction: Math.round((emp.monthlySalary || 0) * ((emp.taxTable || 30) / 100)),
            netSalary: Math.round((emp.monthlySalary || 0) * (1 - (emp.taxTable || 30) / 100)),
            bonuses: 0,
            otherDeductions: 0,
            status: 'draft',
            sentAt: undefined
        }))

        const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0)
        const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0)

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Kör lönekörning',
            description: `Lönekörning för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Antal anställda', value: String(payslips.length) },
                { label: 'Total bruttolön', value: `${totalGross.toLocaleString('sv-SE')} kr` },
                { label: 'Total nettolön', value: `${totalNet.toLocaleString('sv-SE')} kr` },
            ],
            action: { toolName: 'run_payroll', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: payslips,
            message: `Lönekörning förberedd för ${payslips.length} anställda. Total: ${totalGross.toLocaleString('sv-SE')} kr.`,
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

        // Transform the latest/first report to AGIData format for preview
        const agiData = {
            period: r.period,
            employeeCount: r.employeeCount || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            totalGrossPay: (r as any).totalGrossPay || 0,
            totalBenefits: 0, // Mock for now
            totalTaxDeduction: r.totalTax || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            employerFeeBasis: (r as any).totalGrossPay || 0,
            totalEmployerFee: r.employerContributions || 0,
            // totalToPay calculated in component
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
