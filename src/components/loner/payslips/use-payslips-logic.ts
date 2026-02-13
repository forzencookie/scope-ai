"use client"

import { useState, useMemo, useEffect } from "react"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"

export type Payslip = {
    id: string | number
    employee: string
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
    paymentDate?: string
}

export function usePayslipsLogic() {
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())
    const [allPayslips, setAllPayslips] = useState<Payslip[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [employeeCount, setEmployeeCount] = useState(0)

    // Fetch real employee count
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/employees')
                const data = await res.json()
                if (data.employees) setEmployeeCount(data.employees.length)
            } catch { /* ignore */ }
        }
        fetchCount()
    }, [])

    // Fetch real payslips
    const fetchPayslips = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/payroll/payslips')
            const data = await res.json()
            if (data.payslips) {
                // Map DB format to UI format
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setAllPayslips(data.payslips.map((p: any) => ({
                    id: p.id,
                    employee: p.employees?.name || 'Okänd anställd',
                    period: p.period,
                    grossSalary: Number(p.gross_salary),
                    netSalary: Number(p.net_salary),
                    tax: Number(p.tax_deduction),
                    status: p.status,
                    paymentDate: p.payment_date
                })))
            }
        } catch (err) {
            console.error("Failed to fetch payslips:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPayslips()
    }, [])

    const handleRowClick = (slip: Payslip) => {
        setSelectedPayslip(slip)
        setViewDialogOpen(true)
    }

    const stats = useMemo(() => {
        if (!allPayslips.length) {
            return {
                currentPeriod: "Ingen period",
                employeeCount: 0,
                totalGross: 0,
                totalTax: 0,
                totalEmployerContributions: 0
            }
        }

        const periods = Array.from(new Set(allPayslips.map(p => p.period)))
        const currentPeriod = periods[0] || "Okänd period"

        const periodSlips = allPayslips.filter(p => p.period === currentPeriod)
        const totalGross = periodSlips.reduce((sum, p) => sum + p.grossSalary, 0)

        return {
            currentPeriod,
            employeeCount,
            totalGross,
            totalTax: periodSlips.reduce((sum, p) => sum + p.tax, 0),
            totalEmployerContributions: Math.round(totalGross * taxRates.employerContributionRate)
        }
    }, [allPayslips, employeeCount, taxRates.employerContributionRate])

    const filteredPayslips = useMemo(() => {
        return allPayslips.filter(slip => {
            const matchesSearch = !searchQuery ||
                slip.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                slip.period.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = statusFilter.length === 0 ||
                statusFilter.includes(slip.status)

            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, allPayslips])

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === filteredPayslips.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredPayslips.map(p => String(p.id))))
        }
    }

    const handlePayslipCreated = async () => {
        fetchPayslips()
        // Refresh employee count in case a new employee was saved
        try {
            const res = await fetch('/api/employees')
            const data = await res.json()
            if (data.employees) setEmployeeCount(data.employees.length)
        } catch { /* ignore */ }
    }

    const handleDelete = (ids: string[]) => {
        setAllPayslips(prev => prev.filter(p => !ids.includes(String(p.id))))
        setSelectedIds(new Set())
    }

    const clearSelection = () =>  setSelectedIds(new Set())

    return {
        // State
        allPayslips,
        filteredPayslips,
        isLoading,
        selectedIds,
        searchQuery,
        setSearchQuery,
        statusFilter, 
        setStatusFilter,
        selectedPayslip,
        
        // Dialog Control
        viewDialogOpen,
        setViewDialogOpen,
        showAIDialog,
        setShowAIDialog,

        // Derived Data
        stats,

        // Handlers
        handleRowClick,
        toggleSelection,
        toggleAll,
        handlePayslipCreated,
        handleDelete,
        clearSelection
    }
}
