
import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createBrowserClient } from '@/lib/database/client'

export interface Employee {
    id: string
    name: string
    role: string
    email?: string
    salary: number
    status: string
    balance: number // 2820 Debt
    mileage: number // 7330 Mileage Cost
    kommun?: string
    tax_rate?: number
    personal_number?: string
}

export interface NewEmployee {
    name: string
    role: string
    email?: string
    salary: number
    kommun?: string
}

export const employeeQueryKeys = {
    all: ["employees"] as const,
    list: () => [...employeeQueryKeys.all, "list"] as const,
}

export function useEmployees() {
    const queryClient = useQueryClient()

    const {
        data: employees = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: employeeQueryKeys.list(),
        queryFn: async () => {
            const supabase = createBrowserClient()
            const { data, error } = await supabase.rpc('get_employee_balances')
            if (error) throw error
            return (data || []) as Employee[]
        },
        staleTime: 5 * 60 * 1000,
    })

    const addMutation = useMutation({
        mutationFn: async (employee: NewEmployee): Promise<Employee> => {
            const supabase = createBrowserClient()
            const { data, error } = await supabase
                .from('employees')
                .insert({
                    name: employee.name,
                    role: employee.role,
                    email: employee.email,
                    monthly_salary: employee.salary,
                    kommun: employee.kommun || null,
                    status: 'active'
                })
                .select()
                .single()

            if (error) throw error

            return {
                ...data,
                salary: data.monthly_salary,
                balance: 0,
                mileage: 0
            } as Employee
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })
        },
    })

    const addEmployee = useCallback(async (employee: NewEmployee): Promise<Employee | null> => {
        try {
            return await addMutation.mutateAsync(employee)
        } catch (err) {
            console.error("Failed to add employee:", err)
            return null
        }
    }, [addMutation])

    return { employees, isLoading, error, refresh: refetch, addEmployee }
}
