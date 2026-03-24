import { createBrowserClient } from '@/lib/database/client'
import { nullToUndefined } from '@/lib/utils'
import type { Database } from '@/types/database'

// The generated DB types for these tables are incomplete stubs.
// We extend the Row types with the columns the mappers actually access.
type IncomeDeclarationRow = Database['public']['Tables']['income_declarations']['Row'] & {
    tax_year?: number | null
    due_date?: string | null
    revenue?: number | null
    expenses?: number | null
    profit_before_tax?: number | null
    tax_amount?: number | null
    status?: string | null
    submitted_at?: string | null
}

type NEAppendixRow = Database['public']['Tables']['ne_appendices']['Row'] & {
    tax_year?: number | null
    business_income?: number | null
    business_expenses?: number | null
    net_business_income?: number | null
    egenavgifter?: number | null
    schablonavdrag?: number | null
    status?: string | null
    submitted_at?: string | null
}

type AnnualClosingRow = Database['public']['Tables']['annual_closings']['Row'] & {
    fiscal_year?: number | null
    fiscal_year_start?: string | null
    fiscal_year_end?: string | null
    total_revenue?: number | null
    total_expenses?: number | null
    net_profit?: number | null
    total_assets?: number | null
    total_liabilities?: number | null
    total_equity?: number | null
    status?: string | null
    completed_at?: string | null
}

type AnnualReportRow = Database['public']['Tables']['annual_reports']['Row'] & {
    fiscal_year?: number | null
    company_name?: string | null
    org_number?: string | null
    report_sections?: Record<string, unknown> | null
    directors_report?: string | null
    auditor_report?: string | null
    status?: string | null
    approved_at?: string | null
    submitted_at?: string | null
    bolagsverket_reference?: string | null
}

// ==========================================
// Inkomstdeklaration (Income Tax Declaration)
// ==========================================

export type IncomeDeclaration = {
    id: string
    taxYear: number
    dueDate?: string
    revenue: number
    expenses: number
    profitBeforeTax: number
    taxAmount: number
    status: 'Utkast' | 'Klar' | 'Inskickad'
    submittedAt?: string
}

export async function getIncomeDeclarations(taxYear?: number): Promise<IncomeDeclaration[]> {
    const supabase = createBrowserClient()
    let query = supabase.from('income_declarations').select('*').order('tax_year', { ascending: false })
    if (taxYear) query = query.eq('tax_year', taxYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch income declarations:', error); return [] }
    return (data || []).map((d: IncomeDeclarationRow) => ({
        id: d.id,
        taxYear: d.tax_year || 0,
        dueDate: nullToUndefined(d.due_date),
        revenue: Number(d.revenue) || 0,
        expenses: Number(d.expenses) || 0,
        profitBeforeTax: Number(d.profit_before_tax) || 0,
        taxAmount: Number(d.tax_amount) || 0,
        status: (d.status as IncomeDeclaration['status']) || 'Utkast',
        submittedAt: nullToUndefined(d.submitted_at),
    }))
}

// ==========================================
// NE-bilaga (Sole Proprietor Appendix)
// ==========================================

export type NEAppendix = {
    id: string
    taxYear: number
    businessIncome: number
    businessExpenses: number
    netBusinessIncome: number
    egenavgifter: number
    schablonavdrag: number
    status: 'Utkast' | 'Klar' | 'Inskickad'
    submittedAt?: string
}

export async function getNEAppendix(taxYear?: number): Promise<NEAppendix[]> {
    const supabase = createBrowserClient()
    let query = supabase.from('ne_appendices').select('*').order('tax_year', { ascending: false })
    if (taxYear) query = query.eq('tax_year', taxYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch NE appendix:', error); return [] }
    return (data || []).map((d: NEAppendixRow) => ({
        id: d.id,
        taxYear: d.tax_year || 0,
        businessIncome: Number(d.business_income) || 0,
        businessExpenses: Number(d.business_expenses) || 0,
        netBusinessIncome: Number(d.net_business_income) || 0,
        egenavgifter: Number(d.egenavgifter) || 0,
        schablonavdrag: Number(d.schablonavdrag) || 0,
        status: (d.status as NEAppendix['status']) || 'Utkast',
        submittedAt: nullToUndefined(d.submitted_at),
    }))
}

// ==========================================
// Årsbokslut (Annual Closing)
// ==========================================

export type AnnualClosing = {
    id: string
    fiscalYear: number
    fiscalYearStart?: string
    fiscalYearEnd?: string
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    status: 'Utkast' | 'Pågår' | 'Klar' | 'Inskickad'
    completedAt?: string
}

export async function getAnnualClosings(fiscalYear?: number): Promise<AnnualClosing[]> {
    const supabase = createBrowserClient()
    let query = supabase.from('annual_closings').select('*').order('fiscal_year', { ascending: false })
    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch annual closings:', error); return [] }
    return (data || []).map((d: AnnualClosingRow) => ({
        id: d.id,
        fiscalYear: d.fiscal_year || 0,
        fiscalYearStart: nullToUndefined(d.fiscal_year_start),
        fiscalYearEnd: nullToUndefined(d.fiscal_year_end),
        totalRevenue: Number(d.total_revenue) || 0,
        totalExpenses: Number(d.total_expenses) || 0,
        netProfit: Number(d.net_profit) || 0,
        totalAssets: Number(d.total_assets) || 0,
        totalLiabilities: Number(d.total_liabilities) || 0,
        totalEquity: Number(d.total_equity) || 0,
        status: (d.status as AnnualClosing['status']) || 'Utkast',
        completedAt: nullToUndefined(d.completed_at),
    }))
}

// ==========================================
// Årsredovisning (Annual Report)
// ==========================================

export type AnnualReport = {
    id: string
    fiscalYear: number
    companyName?: string
    orgNumber?: string
    reportSections: Record<string, unknown>
    directorsReport?: string
    auditorReport?: string
    status: 'draft' | 'review' | 'approved' | 'submitted'
    approvedAt?: string
    submittedAt?: string
    bolagsverketReference?: string
}

export async function getAnnualReports(fiscalYear?: number): Promise<AnnualReport[]> {
    const supabase = createBrowserClient()
    let query = supabase.from('annual_reports').select('*').order('fiscal_year', { ascending: false })
    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch annual reports:', error); return [] }
    return (data || []).map((d: AnnualReportRow) => ({
        id: d.id,
        fiscalYear: d.fiscal_year || 0,
        companyName: nullToUndefined(d.company_name),
        orgNumber: nullToUndefined(d.org_number),
        reportSections: (d.report_sections || {}) as Record<string, unknown>,
        directorsReport: nullToUndefined(d.directors_report),
        auditorReport: nullToUndefined(d.auditor_report),
        status: (d.status as AnnualReport['status']) || 'draft',
        approvedAt: nullToUndefined(d.approved_at),
        submittedAt: nullToUndefined(d.submitted_at),
        bolagsverketReference: nullToUndefined(d.bolagsverket_reference),
    }))
}

// ==========================================
// Combined Tax Service
// ==========================================

export const taxDeclarationService = {
    getIncomeDeclarations,
    getNEAppendix,
    getAnnualClosings,
    getAnnualReports,
}
