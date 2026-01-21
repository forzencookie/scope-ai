import { getSupabaseClient } from '../supabase'
import { mockEmployees, mockPayrollStats, mockPayrollRuns } from '@/data/mock-data'

export type PayrollStats = {
    currentPeriod: string
    employeeCount: number
    totalGross: number
    totalTax: number
}

export type Employee = {
    id: string
    name: string
    personalNumber?: string
    role?: string
    monthlySalary: number
    taxTable: number
    startDate?: string
    email?: string
    status: 'active' | 'inactive'
}

export type Payslip = {
    id: string
    employeeId: string
    employeeName: string
    period: string
    year: number
    month: number
    grossSalary: number
    taxDeduction: number
    netSalary: number
    bonuses: number
    otherDeductions: number
    status: 'draft' | 'pending' | 'sent'
    sentAt?: string
}

export type AGIReport = {
    id: string
    period: string
    year: number
    month: number
    dueDate: string
    employeeCount: number
    totalSalary: number
    totalTax: number
    employerContributions: number
    status: 'draft' | 'pending' | 'submitted'
    submittedAt?: string
}

export const payrollService = {
    /**
     * Get aggregate statistics for payroll from the database.
     */
    async getStats(): Promise<PayrollStats> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('get_payroll_stats') as { data: any, error: any }

        const getCurrentPeriod = () => {
            const now = new Date()
            const month = now.toLocaleString('sv-SE', { month: 'long' })
            const year = now.getFullYear()
            return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
        }

        const fallbackPeriod = getCurrentPeriod()

        if (error || !data || data.employeeCount === 0) {
            // Return mock stats when no real data
            return {
                currentPeriod: fallbackPeriod,
                employeeCount: mockPayrollStats.employeeCount,
                totalGross: mockPayrollStats.totalGross,
                totalTax: mockPayrollStats.totalGross - mockPayrollStats.totalNet,
            }
        }

        return {
            currentPeriod: (data.currentPeriod && data.currentPeriod !== 'Ingen period') ? data.currentPeriod : fallbackPeriod,
            employeeCount: Number(data.employeeCount) || 0,
            totalGross: Number(data.totalGross) || 0,
            totalTax: Number(data.totalTax) || 0,
        }
    },

    /**
     * Get all employees for current user.
     */
    async getEmployees(): Promise<Employee[]> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name')

        if (error || !data || data.length === 0) {
            // Return mock employees when no real data
            return mockEmployees.map(e => ({
                id: e.id,
                name: e.name,
                personalNumber: e.ssn,
                role: e.role,
                monthlySalary: e.salary,
                taxTable: 33,
                startDate: e.startDate,
                email: e.email,
                status: 'active' as const,
            }))
        }

        return (data || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            personalNumber: e.personal_number,
            role: e.role,
            monthlySalary: Number(e.monthly_salary) || 0,
            taxTable: e.tax_table || 33,
            startDate: e.start_date,
            email: e.email,
            status: e.status || 'active',
        }))
    },

    /**
     * Get payslips, optionally filtered by year/month.
     */
    async getPayslips(year?: number, month?: number): Promise<Payslip[]> {
        const supabase = getSupabaseClient()
        let query = supabase
            .from('payslips')
            .select('*, employees(name)')
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (year) query = query.eq('year', year)
        if (month) query = query.eq('month', month)

        const { data, error } = await query

        if (error || !data || data.length === 0) {
            // Return mock payslips when no real data
            return mockEmployees.map((emp, idx) => ({
                id: `ps-${idx}`,
                employeeId: emp.id,
                employeeName: emp.name,
                period: 'Januari 2025',
                year: 2025,
                month: 1,
                grossSalary: emp.salary,
                taxDeduction: Math.round(emp.salary * 0.30),
                netSalary: Math.round(emp.salary * 0.70),
                bonuses: 0,
                otherDeductions: 0,
                status: 'sent' as const,
                sentAt: '2025-01-25',
            }))
        }

        return (data || []).map((p: any) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employees?.name || 'Okänd',
            period: p.period,
            year: p.year,
            month: p.month,
            grossSalary: Number(p.gross_salary) || 0,
            taxDeduction: Number(p.tax_deduction) || 0,
            netSalary: Number(p.net_salary) || 0,
            bonuses: Number(p.bonuses) || 0,
            otherDeductions: Number(p.other_deductions) || 0,
            status: p.status || 'draft',
            sentAt: p.sent_at,
        }))
    },

    /**
     * Get AGI reports, optionally filtered by year.
     */
    async getAGIReports(year?: number): Promise<AGIReport[]> {
        const supabase = getSupabaseClient()
        let query = supabase
            .from('agi_reports')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })

        if (year) query = query.eq('year', year)

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch AGI reports:', error)
            return []
        }

        return (data || []).map((r: any) => ({
            id: r.id,
            period: r.period,
            year: r.year,
            month: r.month,
            dueDate: r.due_date,
            employeeCount: r.employee_count || 0,
            totalSalary: Number(r.total_salary) || 0,
            totalTax: Number(r.total_tax) || 0,
            employerContributions: Number(r.employer_contributions) || 0,
            status: r.status || 'draft',
            submittedAt: r.submitted_at,
        }))
    },
}
