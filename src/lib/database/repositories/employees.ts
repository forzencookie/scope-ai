/**
 * Employees Repository
 * 
 * Handles all employee-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { EmployeeInput } from './types'

type DbClient = SupabaseClient<Database>

export function createEmployeesRepository(supabase: DbClient) {
    return {
        /**
         * Get employees with optional limit
         */
        async list(limit?: number) {
            let query = supabase
                .from('employees')
                .select('*')
                .order('name')

            if (limit) query = query.limit(limit)
            else query = query.limit(100) // Default pagination

            const { data, error } = await query
            if (error) console.error('Supabase Error (getEmployees):', error)
            return data || []
        },

        /**
         * Get a single employee by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new employee
         */
        async create(employee: EmployeeInput) {
            const { data, error } = await supabase
                .from('employees')
                .insert({
                    name: employee.name,
                    role: employee.role,
                    email: employee.email,
                    salary: employee.salary,
                    status: employee.status || 'active',
                    employment_date: employee.employment_date || new Date().toISOString().split('T')[0]
                })
                .select()
                .single()

            if (error) {
                console.error('Supabase Error (addEmployee):', error)
                throw new Error(`Failed to add employee: ${error.message}`)
            }
            return data
        },

        /**
         * Update an employee
         */
        async update(id: string, updates: Partial<EmployeeInput>) {
            const { data, error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('[EmployeesRepository] update error:', error)
                return null
            }
            return data
        },
    }
}

export type EmployeesRepository = ReturnType<typeof createEmployeesRepository>
