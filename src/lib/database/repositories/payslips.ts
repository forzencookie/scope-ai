/**
 * Payslips Repository
 * 
 * Handles all payslip-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PayslipInput } from './types'

type DbClient = SupabaseClient<Database>

export function createPayslipsRepository(supabase: DbClient) {
    return {
        /**
         * Get payslips with optional limit, includes employee data
         */
        async list(limit?: number) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = supabase.from('payslips' as any)
                .select('*, employees(*)')
                .order('created_at', { ascending: false })

            if (limit) query = query.limit(limit)
            else query = query.limit(50) // Default pagination

            const { data, error } = await query
            if (error) console.error('Supabase Error (getPayslips):', error)
            return data || []
        },

        /**
         * Get a single payslip by ID
         */
        async getById(id: string) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase.from('payslips' as any)
                .select('*, employees(*)')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new payslip
         */
        async create(payslip: PayslipInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase.from('payslips' as any)
                .insert({
                    id: payslip.id,
                    employee_id: payslip.employee_id,
                    period: payslip.period,
                    gross_salary: payslip.gross_salary,
                    tax_deduction: payslip.tax_deduction,
                    net_salary: payslip.net_salary,
                    bonuses: payslip.bonuses || 0,
                    deductions: payslip.deductions || 0,
                    status: payslip.status || 'draft',
                    payment_date: payslip.payment_date,
                    user_id: payslip.user_id,
                })
                .select()
                .single()

            if (error) console.error('Supabase Error (addPayslip):', error)
            return data || payslip
        },
    }
}

export type PayslipsRepository = ReturnType<typeof createPayslipsRepository>
