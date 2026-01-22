/**
 * Löner AI Tools - Payroll
 *
 * Tools for payroll management, salary calculations, and AGI submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { payrollService, type Payslip, type Employee, type AGIReport } from '@/lib/services/payroll-service'

// =============================================================================
// Payslip Tools
// =============================================================================

export interface GetPayslipsParams {
    period?: string
    employee?: string
}

export const getPayslipsTool = defineTool<GetPayslipsParams, Payslip[]>({
    name: 'get_payslips',
    description: 'Hämta lönebesked för anställda. Kan filtreras på period eller anställd.',
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
            display: {
                component: 'PayslipsTable',
                props: { payslips },
                title: 'Lönebesked',
                fullViewRoute: '/dashboard/loner?tab=lonebesked',
            },
        }
    },
})

export const getEmployeesTool = defineTool<Record<string, never>, Employee[]>({
    name: 'get_employees',
    description: 'Hämta lista över alla anställda.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const employees = await payrollService.getEmployees()

        return {
            success: true,
            data: employees,
            message: `Du har ${employees.length} anställda.`,
            display: {
                component: 'EmployeeList',
                props: { employees },
                title: 'Anställda',
                fullViewRoute: '/dashboard/loner?tab=personal',
            },
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
    description: 'Kör lönekörning för en period. Kräver bekräftelse.',
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
    execute: async (params) => {
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
            taxDeduction: Math.round((emp.monthlySalary || 0) * 0.25),
            netSalary: Math.round((emp.monthlySalary || 0) * 0.75),
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

// =============================================================================
// Salary Calculator
// =============================================================================

export interface CalculateSalaryParams {
    grossSalary: number
    taxTable?: number
    employeeAge?: number
}

export const calculateSalaryTool = defineTool<CalculateSalaryParams, any>({
    name: 'calculate_salary',
    description: 'Beräkna lön, skatt och arbetsgivaravgifter baserat på bruttolön.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            grossSalary: { type: 'number', description: 'Bruttolön i kronor' },
            taxTable: { type: 'number', description: 'Skattetabell (standard: 33)' },
            employeeAge: { type: 'number', description: 'Ålder på anställd (påverkar arbetsgivaravgifter)' },
        },
        required: ['grossSalary'],
    },
    execute: async (params) => {
        const gross = params.grossSalary
        const taxTable = params.taxTable || 33
        const age = params.employeeAge || 35

        const taxPercent = taxTable / 100
        const preliminaryTax = Math.round(gross * taxPercent)
        const netSalary = gross - preliminaryTax

        let agRate = 0.3142
        if (age < 26 || age >= 66) agRate = 0.1021

        const employerContributions = Math.round(gross * agRate)
        const totalCost = gross + employerContributions

        return {
            success: true,
            data: { grossSalary: gross, preliminaryTax, netSalary, employerContributions, totalCost, taxTable, agRate: Math.round(agRate * 10000) / 100 },
            message: `Brutto: ${gross.toLocaleString('sv-SE')} kr → Netto: ${netSalary.toLocaleString('sv-SE')} kr. Total kostnad: ${totalCost.toLocaleString('sv-SE')} kr.`,
            display: {
                component: 'SalaryCalculation' as any,
                props: { grossSalary: gross, netSalary, totalCost },
                title: 'Löneberäkning',
                fullViewRoute: '/dashboard/loner',
            },
        }
    },
})

// =============================================================================
// AGI Tools
// =============================================================================

export const getAGIReportsTool = defineTool<{ period?: string }, AGIReport[]>({
    name: 'get_agi_reports',
    description: 'Hämta AGI-rapporter (arbetsgivardeklarationer). Kan filtreras på period.',
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
        return {
            success: true,
            data: reports,
            message: `Hittade ${reports.length} AGI-rapporter. Senaste: Skatt ${r.totalTax.toLocaleString('sv-SE')} kr, arbetsgivaravgifter ${r.employerContributions.toLocaleString('sv-SE')} kr.`,
            display: {
                component: 'DeadlinesList',
                props: { items: reports },
                title: 'AGI-rapporter',
                fullViewRoute: '/dashboard/skatt?tab=agi',
            },
        }
    },
})

export interface SubmitAGIParams {
    period: string
}

export const submitAGITool = defineTool<SubmitAGIParams, { submitted: boolean; referenceNumber: string }>({
    name: 'submit_agi_declaration',
    description: 'Skicka in arbetsgivardeklaration (AGI) till Skatteverket. Kräver alltid bekräftelse.',
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
    calculateSalaryTool,
    getAGIReportsTool,
    submitAGITool,
]
