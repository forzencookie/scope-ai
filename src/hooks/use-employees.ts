
import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { payrollService, type Employee } from "@/services/payroll/payroll-service"

export type { Employee }

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
            return await payrollService.getEmployees()
        },
        staleTime: 5 * 60 * 1000,
    })

    const addMutation = useMutation({
        mutationFn: async (employee: NewEmployee): Promise<Employee> => {
            return await payrollService.createEmployee({
                name: employee.name,
                role: employee.role,
                email: employee.email,
                monthlySalary: employee.salary,
                kommun: employee.kommun,
            })
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
