import { createBrowserClient } from '@/lib/database/client'
import { nullToUndefined } from '@/lib/utils'
import type { Database } from '@/types/database'

type EmployeeRow = Database['public']['Tables']['employees']['Row']
type PayslipRow = Database['public']['Tables']['payslips']['Row'] & {
    employees?: { name: string } | null
}
type AGIReportRow = Database['public']['Tables']['agi_reports']['Row']


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
    taxTable: number | null
    startDate?: string
    email?: string
    status: 'Aktiv' | 'Inaktiv'
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
    status: 'Utkast' | 'Godkänd' | 'Skickad'
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
    status: 'Utkast' | 'Klar' | 'Inskickad'
    submittedAt?: string
}

/** Map a database row to the Employee UI model. */
function mapRowToEmployee(e: EmployeeRow): Employee {
    return {
        id: e.id,
        name: e.name,
        personalNumber: nullToUndefined(e.personal_number),
        role: nullToUndefined(e.role),
        monthlySalary: Number(e.monthly_salary) || 0,
        taxTable: e.tax_table_number ?? null,
        startDate: nullToUndefined(e.start_date),
        email: nullToUndefined(e.email),
        status: (e.status as Employee['status']) || 'Aktiv',
    }
}

/** Map a database row to the Payslip UI model. */
function mapRowToPayslip(p: PayslipRow): Payslip {
    // Derive year/month from period string (e.g. "2026-03")
    const periodStr = p.period ?? ''
    const [yearStr, monthStr] = periodStr.split('-')
    return {
        id: p.id,
        employeeId: p.employee_id || '',
        employeeName: p.employees?.name || 'Okänd',
        period: periodStr,
        year: parseInt(yearStr) || 0,
        month: parseInt(monthStr) || 0,
        grossSalary: Number(p.gross_salary) || 0,
        taxDeduction: Number(p.tax_deduction) || 0,
        netSalary: Number(p.net_salary) || 0,
        bonuses: Number(p.bonuses) || 0,
        otherDeductions: Number(p.deductions) || 0,
        status: (p.status as Payslip['status']) || 'Utkast',
        sentAt: nullToUndefined(p.payment_date),
    }
}

/** Map a database row to the AGIReport UI model. */
function mapRowToAGIReport(r: AGIReportRow): AGIReport {
    return {
        id: r.id,
        period: r.period || '',
        year: r.year || 0,
        month: r.month || 0,
        dueDate: r.due_date || '',
        employeeCount: r.employee_count || 0,
        totalSalary: Number(r.total_salary) || 0,
        totalTax: Number(r.total_tax) || 0,
        employerContributions: Number(r.employer_contributions) || 0,
        status: (r.status as AGIReport['status']) || 'Utkast',
        submittedAt: nullToUndefined(r.updated_at),
    }
}

export const payrollService = {
    /**
     * Create a new employee
     */
    async createEmployee(params: {
        name: string
        role?: string
        email?: string
        monthlySalary: number
        kommun?: string
    }): Promise<Employee> {
        const supabase = createBrowserClient()

        // Get user and company context
        const [{ data: { user } }, { data: company }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('companies').select('id').single()
        ])

        if (!user || !company) throw new Error('Ej inloggad eller företag saknas.')

        const { data, error } = await supabase
            .from('employees')
            .insert({
                user_id: user.id,
                company_id: company.id,
                name: params.name,
                role: params.role || null,
                email: params.email || null,
                monthly_salary: params.monthlySalary,
                kommun: params.kommun || null,
                status: 'active'
            })
            .select()
            .single()

        if (error) throw error
        return mapRowToEmployee(data)
    },

    /**
     * Get aggregate statistics for payroll from the database.
    ...
    async getStats(): Promise<PayrollStats> {
        const supabase = createBrowserClient()
        const { data: rawData, error } = await supabase.rpc('get_payroll_stats')
        const data = rawData as Record<string, unknown> | null

        const getCurrentPeriod = () => {
            const now = new Date()
            const month = now.toLocaleString('sv-SE', { month: 'long' })
            const year = now.getFullYear()
            return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
        }

        const fallbackPeriod = getCurrentPeriod()

        if (error || !data || Number(data.employeeCount) === 0) {
            return {
                currentPeriod: fallbackPeriod,
                employeeCount: 0,
                totalGross: 0,
                totalTax: 0,
            }
        }

        const period = String(data.currentPeriod || '')
        return {
            currentPeriod: (period && period !== 'Ingen period') ? period : fallbackPeriod,
            employeeCount: Number(data.employeeCount) || 0,
            totalGross: Number(data.totalGross) || 0,
            totalTax: Number(data.totalTax) || 0,
        }
    },

    /**
     * Get all employees for current user.
     */
    async getEmployees(): Promise<Employee[]> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name')

        if (error || !data || data.length === 0) {
            return []
        }

        return (data || []).map(mapRowToEmployee)
    },

    /**
     * Get payslips, optionally filtered by year/month.
     */
    async getPayslips(year?: number, month?: number): Promise<Payslip[]> {
        const supabase = createBrowserClient()
        let query = supabase
            .from('payslips')
            .select('*, employees(name)')
            .order('period', { ascending: false })

        // Filter by period prefix (e.g. "2026" or "2026-03")
        if (year && month) {
            const periodFilter = `${year}-${String(month).padStart(2, '0')}`
            query = query.eq('period', periodFilter)
        } else if (year) {
            query = query.like('period', `${year}-%`)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
            return []
        }

        return (data || []).map(mapRowToPayslip)
    },

    /**
     * Get AGI reports, optionally filtered by year.
     */
    async getAGIReports(year?: number): Promise<AGIReport[]> {
        const supabase = createBrowserClient()
        const query = supabase
            .from('agi_reports')
            .select('*')
            .order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch AGI reports:', error)
            return []
        }

        return (data || []).map(mapRowToAGIReport)
    },

    /**
     * Get IDs of payslips with draft status (pending approval)
     */
    async getPendingPayslipIds(): Promise<string[]> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('payslips')
            .select('id')
            .eq('status', 'draft')

        if (error) throw error
        return (data || []).map(r => r.id as string)
    },

    /**
     * Get payslips that are not yet sent/paid
     */
    async getUnpaidPayslips(): Promise<Payslip[]> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('payslips')
            .select('*, employees(name)')
            .not('status', 'eq', 'sent')
            .order('period', { ascending: false })

        if (error) throw error
        return (data || []).map(mapRowToPayslip)
    },

    async updateEmployee(id: string, updates: {
        name?: string
        role?: string
        monthlySalary?: number
        status?: string
        kommun?: string
        email?: string
    }): Promise<Employee> {
        const supabase = createBrowserClient()

        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (updates.name !== undefined) patch.name = updates.name
        if (updates.role !== undefined) patch.role = updates.role
        if (updates.monthlySalary !== undefined) patch.monthly_salary = updates.monthlySalary
        if (updates.status !== undefined) patch.status = updates.status
        if (updates.kommun !== undefined) patch.kommun = updates.kommun
        if (updates.email !== undefined) patch.email = updates.email

        const { data, error } = await supabase
            .from('employees')
            .update(patch)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return mapRowToEmployee(data)
    },
}
