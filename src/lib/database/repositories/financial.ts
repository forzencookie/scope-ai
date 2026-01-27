/**
 * Financial Reports Repository
 * 
 * Handles financial periods, tax reports, AI audit logs, and KPIs.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TaxReportInput, AIToolLogInput, Json } from './types'

type DbClient = SupabaseClient<Database>

export function createFinancialRepository(supabase: DbClient) {
    return {
        // ====================================================================
        // Financial Periods
        // ====================================================================

        /**
         * Get all financial periods
         */
        async listPeriods() {
            const { data, error } = await supabase
                .from('financialperiods')
                .select('*')
                .order('start_date', { ascending: false })

            if (error) console.error('Supabase Error (getFinancialPeriods):', error)
            return data || []
        },

        /**
         * Update financial period status
         */
        async updatePeriodStatus(id: string, status: string) {
            const { error } = await supabase
                .from('financialperiods')
                .update({ status })
                .eq('id', id)

            if (error) console.error('Supabase Error (updateFinancialPeriodStatus):', error)
            return { success: !error }
        },

        // ====================================================================
        // Tax Reports
        // ====================================================================

        /**
         * Get tax reports with optional type filter
         */
        async listTaxReports(type?: string) {
            let query = supabase
                .from('taxreports')
                .select('*')
                .order('generated_at', { ascending: false })

            if (type) query = query.eq('type', type)

            const { data, error } = await query
            if (error) console.error('Supabase Error (getTaxReports):', error)
            return data || []
        },

        /**
         * Upsert a tax report
         */
        async upsertTaxReport(report: TaxReportInput) {
            const { data, error } = await supabase
                .from('taxreports')
                .upsert({
                    id: report.id || undefined,
                    user_id: report.user_id,
                    period_id: report.period_id,
                    type: report.report_type || 'vat',
                    data: report.data,
                    status: report.status || 'draft',
                    period_start: report.period_start,
                    period_end: report.period_end,
                    generated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) console.error('Supabase Error (upsertTaxReport):', error)
            return data || report
        },

        // ====================================================================
        // AI Audit Logs
        // ====================================================================

        /**
         * Log an AI tool execution
         */
        async logAIToolExecution(log: AIToolLogInput) {
            const { data, error } = await supabase
                .from('ai_audit_log')
                .insert({
                    tool_name: log.toolName,
                    parameters: log.parameters as unknown as Json,
                    result: log.result as unknown as Json,
                    status: log.status,
                    execution_time_ms: log.executionTimeMs,
                    error_message: log.errorMessage,
                    user_id: log.userId
                })
                .select()
                .single()

            if (error) console.error('Supabase Error (logAIToolExecution):', error)
            return data
        },

        // ====================================================================
        // KPIs & Aggregations
        // ====================================================================

        /**
         * Get company KPIs for AI context
         */
        async getCompanyKPIs() {
            // Parallel queries for speed
            const [tx, invoices, inbox] = await Promise.all([
                supabase.from('transactions').select('amount, status').limit(100),
                supabase.from('supplierinvoices').select('amount, due_date, status').eq('status', 'unpaid'),
                supabase.from('inboxitems').select('count', { count: 'exact', head: true }).eq('read', false)
            ])

            return {
                recent_transactions_count: tx.data?.length || 0,
                unpaid_invoices_count: invoices.data?.length || 0,
                unread_inbox_count: inbox.count || 0,
                last_sync: new Date().toISOString()
            }
        },
    }
}

export type FinancialRepository = ReturnType<typeof createFinancialRepository>
