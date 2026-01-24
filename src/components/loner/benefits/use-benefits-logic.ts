"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { listAvailableBenefits, assignBenefit, suggestUnusedBenefits } from "@/lib/formaner"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai/tool-types"

export function useBenefitsLogic() {
    const [benefits, setBenefits] = useState<FormanCatalogItem[]>([])
    const [assignedBenefits, setAssignedBenefits] = useState<EmployeeBenefit[]>([])
    const [suggestions, setSuggestions] = useState<FormanCatalogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [employeeCount, setEmployeeCount] = useState(0)
    
    // Retry mechanism
    const [retryCount, setRetryCount] = useState(0)

    // UI Interactive State
    const [selectedBenefit, setSelectedBenefit] = useState<FormanCatalogItem | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const currentYear = new Date().getFullYear()

    useEffect(() => {
        let isMounted = true

        async function loadAllData() {
            setIsLoading(true)
            setError(null)

            try {
                const [allBenefits, unusedSuggestions, empRes] = await Promise.all([
                    listAvailableBenefits('AB'),
                    suggestUnusedBenefits('Demo Anställd', currentYear, 'AB'),
                    fetch('/api/employees')
                ])

                const empData = await empRes.json()
                const realCount = empData.employees?.length || 0

                if (isMounted) {
                    setBenefits(allBenefits)
                    setSuggestions(unusedSuggestions)
                    setEmployeeCount(realCount)
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Failed to load benefits data:', err)
                    setError('Kunde inte hämta förmånsdata. Försök igen.')
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadAllData()

        return () => {
            isMounted = false
        }
    }, [currentYear, retryCount])

    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1)
    }, [])

    // Derived Stats
    const stats = useMemo(() => {
        const totalCost = assignedBenefits.reduce((sum, b) => sum + (b.amount || 0), 0)
        const uniqueEmployees = new Set(assignedBenefits.map(b => b.employeeName)).size
        const activeBenefits = assignedBenefits.length
        
        // Simplified unused potential logic
        const unusedPotential = 0

        return {
            totalCost,
            employeesWithBenefits: uniqueEmployees,
            totalEmployees: employeeCount,
            unusedPotential,
            totalBenefits: activeBenefits,
            activeBenefits
        }
    }, [assignedBenefits, employeeCount])

    const coveragePercent = stats.totalEmployees > 0
        ? Math.round((stats.employeesWithBenefits / stats.totalEmployees) * 100)
        : 0

    const filteredBenefits = useMemo(() => {
        return benefits.filter(benefit => {
            const lowerQuery = searchQuery.toLowerCase()
            return benefit.name.toLowerCase().includes(lowerQuery) ||
                (benefit.description?.toLowerCase().includes(lowerQuery) ?? false)
        })
    }, [benefits, searchQuery])

    // Grouping
    const groupedBenefits = useMemo(() => ({
        taxFree: filteredBenefits.filter(b => b.category === 'tax_free'),
        taxable: filteredBenefits.filter(b => b.category === 'taxable'),
        salarySacrifice: filteredBenefits.filter(b => b.category === 'salary_sacrifice')
    }), [filteredBenefits])

    const handleRowClick = (benefit: FormanCatalogItem) => {
        setSelectedBenefit(benefit)
        setIsDetailsOpen(true)
    }

    const handleAssign = async (employeeName: string, amount: number) => {
        if (!selectedBenefit) return

        const assigned = await assignBenefit({
            employeeName,
            benefitType: selectedBenefit.id,
            amount,
            year: currentYear,
        })

        if (assigned) {
            setAssignedBenefits(prev => [assigned, ...prev])
        }
    }

    return {
        // State
        isLoading,
        error,
        stats,
        coveragePercent,
        searchQuery,
        setSearchQuery,
        groupedBenefits,
        assignedBenefits,
        
        // Interactive
        selectedBenefit,
        isDetailsOpen,
        setIsDetailsOpen,
        handleRowClick,
        handleAssign,
        handleRetry
    }
}
