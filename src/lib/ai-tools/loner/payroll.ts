/**
 * Löner AI Tools - Payroll
 *
 * Tools for payroll management, salary calculations, and AGI submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { payrollService, type Payslip, type Employee, type AGIReport } from '@/services/payroll/payroll-service'
import type { Block } from '@/lib/ai/schema'
import { companyService } from '@/services/company/company-service.server'
import { taxService } from '@/services/tax/tax-service'
import { getEmployeeBenefits } from '@/lib/bookkeeping/formaner'
import { createSalaryEntry, createVacationAccrual, calculateEmployerContributions } from '@/lib/bookkeeping'
import { verificationService } from '@/services/accounting/verification-service'

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
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['lönebesked', 'lön', 'lönespecifikation'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
            employee: { type: 'string', description: 'Namn på anställd' },
        },
    },
    execute: async (params) => {
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
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['anställda', 'personal', 'medarbetare'],
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
    allowedCompanyTypes: ['ab'],
    domain: 'loner',
    keywords: ['lönekörning', 'kör lön', 'nettolön', 'skatt', 'anställd'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
            employees: { type: 'array', items: { type: 'string' }, description: 'Lista med anställda (standard: alla)' },
        },
        required: ['period'],
    },
    execute: async (params, context) => {
        // Fetch real employees
        const realEmployees = await payrollService.getEmployees()
        let employees = [...realEmployees]

        if (params.employees && params.employees.length > 0) {
            employees = employees.filter(emp =>
                params.employees!.some(e => emp.name.toLowerCase().includes(e.toLowerCase()))
            )
        }

        const currentYear = new Date().getFullYear()
        const rates = await taxService.getAllTaxRates(currentYear)
        if (!rates) {
            return { success: false, error: `Skattesatser för ${currentYear} saknas — kan inte beräkna löner.` }
        }

        const payslips: Payslip[] = []
        for (const emp of employees) {
            const gross = emp.monthlySalary || 0
            const benefitTaxValue = await getMonthlyBenefitValue(emp.name, currentYear)
            const taxableIncome = gross + benefitTaxValue

            if (!emp.taxTable) {
                return { success: false, error: `Skattetabell saknas för ${emp.name}. Ange skattetabell i personalregistret innan lönekörning.` }
            }
            const skvTax = await taxService.lookupTaxDeduction(currentYear, String(emp.taxTable), 1, taxableIncome)
            if (skvTax === null) {
                return { success: false, error: `Skattetabell ${emp.taxTable} kunde inte slås upp för ${emp.name} (${currentYear}). Kontrollera att skattetabellen finns i systemet.` }
            }
            const tax = skvTax

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
                status: 'Utkast',
            })
        }

        const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0)
        const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0)
        const totalTax = payslips.reduce((sum, p) => sum + p.taxDeduction, 0)

        if (context?.isConfirmed) {
            const savedPayslips: Payslip[] = []
            const errors: string[] = []
            const accrualDate = new Date().toISOString().split('T')[0]

            for (const payslip of payslips) {
                try {
                    const benefitTaxValue = await getMonthlyBenefitValue(payslip.employeeName, currentYear)
                    const employerContributionBasis = payslip.grossSalary + benefitTaxValue
                    const employerContribution = calculateEmployerContributions(employerContributionBasis, rates.employerContributionRate)
                    
                    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/payroll/payslips`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employee_id: payslip.employeeId,
                            period: payslip.period,
                            gross_salary: payslip.grossSalary,
                            tax_deduction: payslip.taxDeduction,
                            net_salary: payslip.netSalary,
                            employer_contributions: employerContribution,
                            employer_contribution_rate: rates.employerContributionRate,
                            status: 'Utkast',
                            payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        }),
                    })

                    if (res.ok) {
                        const data = await res.json()
                        savedPayslips.push({ ...payslip, id: data.payslip?.id || payslip.id })

                        const entry = createSalaryEntry({
                            date: accrualDate,
                            description: `Lön ${payslip.period} - ${payslip.employeeName}`,
                            salary: {
                                grossSalary: payslip.grossSalary,
                                preliminaryTax: payslip.taxDeduction,
                                employerContributions: employerContribution,
                            },
                            paidImmediately: false,
                        })

                        await verificationService.createVerification({
                            series: 'L',
                            date: entry.date,
                            description: entry.description,
                            entries: entry.rows.map(r => ({
                                account: r.account,
                                debit: r.debit,
                                credit: r.credit,
                                description: r.description,
                            })),
                            sourceType: 'payroll_salary',
                            sourceId: String(data.payslip?.id || payslip.id)
                        })
                    } else {
                        errors.push(`${payslip.employeeName}: Kunde inte spara`)
                    }
                } catch (e) {
                    console.error('[Payroll] Failed to process employee:', payslip.employeeName, e)
                    errors.push(`${payslip.employeeName}: Internt fel`)
                }
            }

            let vacationNote = ''
            if (totalGross > 0) {
                try {
                    const vacationEntry = createVacationAccrual({
                        grossSalary: totalGross,
                        date: accrualDate,
                        description: `Semesterlöneskuld ${params.period}`,
                    })

                    await verificationService.createVerification({
                        series: 'L',
                        date: vacationEntry.date,
                        description: vacationEntry.description,
                        entries: vacationEntry.rows.map(r => ({
                            account: r.account,
                            debit: r.debit,
                            credit: r.credit,
                            description: r.description,
                        })),
                        sourceType: 'payroll_vacation_accrual',
                    })
                    vacationNote = `\n\n✅ Semesterlöneskuld bokförd: ${(totalGross * 0.12).toLocaleString('sv-SE')} kr.`
                } catch (accrualError) {
                    vacationNote = `\n\n⚠️ Semesterlöneskuld kunde inte bokföras automatiskt.`
                }
            }

            const payrollBlock: Block = {
                title: `Lönekörning ${params.period}`,
                description: `${savedPayslips.length} lönebesked · Netto totalt ${totalNet.toLocaleString('sv-SE')} kr`,
                rows: savedPayslips.map(p => ({
                    icon: "payslip" as const,
                    title: p.employeeName,
                    description: p.period,
                    amount: p.netSalary,
                    status: "Betald",
                    isNew: true,
                })),
            }

            return {
                success: errors.length === 0,
                data: savedPayslips,
                display: payrollBlock,
                message: errors.length === 0
                    ? `Lönekörning klar! ${savedPayslips.length} lönebesked sparade.${vacationNote}`
                    : `${savedPayslips.length} av ${payslips.length} lönebesked sparade. Fel: ${errors.join('; ')}`,
            }
        }

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

// =============================================================================
// AGI Tools
// =============================================================================

export const getAGIReportsTool = defineTool<{ period?: string }, AGIReport[]>({
    name: 'get_agi_reports',
    description: 'Visa arbetsgivardeklarationer (AGI) som skickats eller är klara för inskickning. Innehåller summor för utbetald lön, skatt och arbetsgivaravgifter.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: ['ab'],
    domain: 'loner',
    keywords: ['AGI', 'arbetsgivardeklaration', 'rapport'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period att filtrera på (t.ex. "December 2024")' },
        },
    },
    execute: async (params) => {
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
    allowedCompanyTypes: ['ab'],
    domain: 'loner',
    keywords: ['AGI', 'deklaration', 'skicka', 'skatteverket'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "December 2024")' },
        },
        required: ['period'],
    },
    execute: async (params) => {
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
