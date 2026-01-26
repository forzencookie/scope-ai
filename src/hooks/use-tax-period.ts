"use client"

import { useState, useEffect, useMemo } from "react"
import { getCurrentBeskattningsar, getK10Deadline } from "@/lib/tax-periods"

export interface TaxPeriod {
    year: number
    deadlineLabel: string
    periodStart: Date
    periodEnd: Date
}

export interface UseTaxPeriodOptions {
    /** Fiscal year end, e.g., '12-31' */
    fiscalYearEnd?: string
    /** Type of tax period: 'income' for INK2, 'k10' for K10 */
    type?: 'income' | 'k10'
}

export interface UseTaxPeriodReturn {
    taxYear: TaxPeriod
    setYear: (year: number) => void
    isLoading: boolean
    /** Available years to select from */
    availableYears: number[]
    /** Display label for the period (e.g., "Inkomstår 2024") */
    periodLabel: string
    /** Formatted period dates (e.g., "2024-01-01 – 2024-12-31") */
    periodDates: string
}

/**
 * useTaxPeriod - Hook for managing tax year/period selection
 * 
 * Uses centralized tax-periods.ts logic for:
 * - Getting current beskattningsår based on fiscal year end
 * - Loading correct deadlines (INK2 vs K10)
 * - Providing selectable years
 * - Formatting period labels
 */
export function useTaxPeriod(options: UseTaxPeriodOptions = {}): UseTaxPeriodReturn {
    const { fiscalYearEnd = '12-31', type = 'income' } = options
    const defaultYear = new Date().getFullYear() - 1
    
    const [taxYear, setTaxYearState] = useState<TaxPeriod>({
        year: defaultYear,
        deadlineLabel: '',
        periodStart: new Date(defaultYear, 0, 1),
        periodEnd: new Date(defaultYear, 11, 31),
    })
    const [isLoading, setIsLoading] = useState(true)

    // Load tax year data on mount and when fiscalYearEnd changes
    useEffect(() => {
        setIsLoading(true)
        try {
            const result = getCurrentBeskattningsar(fiscalYearEnd)
            const deadline = type === 'k10' 
                ? getK10Deadline(result.year)
                : result.deadlineLabel
            
            setTaxYearState({
                year: result.year,
                deadlineLabel: deadline,
                periodStart: new Date(result.year, 0, 1),
                periodEnd: new Date(result.year, 11, 31),
            })
        } finally {
            setIsLoading(false)
        }
    }, [fiscalYearEnd, type])

    const setYear = (year: number) => {
        const deadline = type === 'k10' 
            ? getK10Deadline(year)
            : `1 jul ${year + 1}` // INK2 standard deadline
        
        setTaxYearState(prev => ({
            ...prev,
            year,
            deadlineLabel: deadline,
            periodStart: new Date(year, 0, 1),
            periodEnd: new Date(year, 11, 31),
        }))
    }

    // Generate available years (current - 5 to current)
    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 6 }, (_, i) => currentYear - i)
    }, [])

    // Period label based on type
    const periodLabel = useMemo(() => {
        switch (type) {
            case 'income':
                return `Inkomstår ${taxYear.year}`
            case 'fiscal':
                return `Räkenskapsår ${taxYear.year}`
            case 'vat':
                return `Momsperiod ${taxYear.year}`
            default:
                return `${taxYear.year}`
        }
    }, [taxYear.year, type])

    // Formatted period dates
    const periodDates = useMemo(() => {
        const start = taxYear.periodStart.toISOString().split('T')[0]
        const end = taxYear.periodEnd.toISOString().split('T')[0]
        return `${start} – ${end}`
    }, [taxYear.periodStart, taxYear.periodEnd])

    return {
        taxYear,
        setYear,
        isLoading,
        availableYears,
        periodLabel,
        periodDates,
    }
}
