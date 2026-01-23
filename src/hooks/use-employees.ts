
import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase"

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

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
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

    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    return { employees, isLoading, error, refresh: fetchEmployees }
}
