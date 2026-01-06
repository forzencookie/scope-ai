import { getSupabaseClient } from '../supabase'

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
    status: 'draft' | 'pending' | 'submitted'
    submittedAt?: string
}

export async function getIncomeDeclarations(taxYear?: number): Promise<IncomeDeclaration[]> {
    const supabase = getSupabaseClient()
    let query = supabase.from('income_declarations').select('*').order('tax_year', { ascending: false })
    if (taxYear) query = query.eq('tax_year', taxYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch income declarations:', error); return [] }
    return (data || []).map((d: any) => ({
        id: d.id,
        taxYear: d.tax_year,
        dueDate: d.due_date,
        revenue: Number(d.revenue) || 0,
        expenses: Number(d.expenses) || 0,
        profitBeforeTax: Number(d.profit_before_tax) || 0,
        taxAmount: Number(d.tax_amount) || 0,
        status: d.status || 'draft',
        submittedAt: d.submitted_at,
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
    status: 'draft' | 'pending' | 'submitted'
    submittedAt?: string
}

export async function getNEAppendix(taxYear?: number): Promise<NEAppendix[]> {
    const supabase = getSupabaseClient()
    let query = supabase.from('ne_appendix').select('*').order('tax_year', { ascending: false })
    if (taxYear) query = query.eq('tax_year', taxYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch NE appendix:', error); return [] }
    return (data || []).map((d: any) => ({
        id: d.id,
        taxYear: d.tax_year,
        businessIncome: Number(d.business_income) || 0,
        businessExpenses: Number(d.business_expenses) || 0,
        netBusinessIncome: Number(d.net_business_income) || 0,
        egenavgifter: Number(d.egenavgifter) || 0,
        schablonavdrag: Number(d.schablonavdrag) || 0,
        status: d.status || 'draft',
        submittedAt: d.submitted_at,
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
    status: 'draft' | 'in_progress' | 'completed' | 'submitted'
    completedAt?: string
}

export async function getAnnualClosings(fiscalYear?: number): Promise<AnnualClosing[]> {
    const supabase = getSupabaseClient()
    let query = supabase.from('annual_closings').select('*').order('fiscal_year', { ascending: false })
    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch annual closings:', error); return [] }
    return (data || []).map((d: any) => ({
        id: d.id,
        fiscalYear: d.fiscal_year,
        fiscalYearStart: d.fiscal_year_start,
        fiscalYearEnd: d.fiscal_year_end,
        totalRevenue: Number(d.total_revenue) || 0,
        totalExpenses: Number(d.total_expenses) || 0,
        netProfit: Number(d.net_profit) || 0,
        totalAssets: Number(d.total_assets) || 0,
        totalLiabilities: Number(d.total_liabilities) || 0,
        totalEquity: Number(d.total_equity) || 0,
        status: d.status || 'draft',
        completedAt: d.completed_at,
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
    reportSections: Record<string, any>
    directorsReport?: string
    auditorReport?: string
    status: 'draft' | 'review' | 'approved' | 'submitted'
    approvedAt?: string
    submittedAt?: string
    bolagsverketReference?: string
}

export async function getAnnualReports(fiscalYear?: number): Promise<AnnualReport[]> {
    const supabase = getSupabaseClient()
    let query = supabase.from('annual_reports').select('*').order('fiscal_year', { ascending: false })
    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear)
    const { data, error } = await query
    if (error) { console.error('Failed to fetch annual reports:', error); return [] }
    return (data || []).map((d: any) => ({
        id: d.id,
        fiscalYear: d.fiscal_year,
        companyName: d.company_name,
        orgNumber: d.org_number,
        reportSections: d.report_sections || {},
        directorsReport: d.directors_report,
        auditorReport: d.auditor_report,
        status: d.status || 'draft',
        approvedAt: d.approved_at,
        submittedAt: d.submitted_at,
        bolagsverketReference: d.bolagsverket_reference,
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
