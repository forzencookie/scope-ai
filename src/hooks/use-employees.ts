
import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from '@/lib/database/supabase'

export interface Employee {
    id: string
    name: string
    role: string
    email?: string
    salary: number
    status: string
    balance: number // 2820 Debt
    mileage: number // 7330 Mileage Cost
}

export interface NewEmployee {
    name: string
    role: string
    email?: string
    salary: number
}

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [error, setError] = useState<any>(null)

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true)
        const supabase = getSupabaseClient()
        try {
            const { data, error } = await supabase.rpc('get_employee_balances')

            if (error) throw error

            setEmployees(data || [])
        } catch (err) {
            console.error("Failed to fetch employees:", err)
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const addEmployee = useCallback(async (employee: NewEmployee): Promise<Employee | null> => {
        const supabase = getSupabaseClient()
        try {
            const { data, error } = await supabase
                .from('employees')
                .insert({
                    name: employee.name,
                    role: employee.role,
                    email: employee.email,
                    salary: employee.salary,
                    status: 'active'
                })
                .select()
                .single()

            if (error) throw error

            // Refresh list after adding
            await fetchEmployees()

            return {
                ...data,
                salary: data.monthly_salary,
                balance: 0,
                mileage: 0
            } as Employee
        } catch (err) {
            console.error("Failed to add employee:", err)
            setError(err)
            return null
        }
    }, [fetchEmployees])

    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    return { employees, isLoading, error, refresh: fetchEmployees, addEmployee }
}
