"use client"

import { useState, useEffect } from "react"
import { useVerifications } from "./use-verifications"
import { useCompany } from "@/providers/company-provider"
import { getSupabaseClient } from '@/lib/database/supabase'

export type PeriodStatus = 'open' | 'review' | 'locked'

export interface MonthStatus {
    id?: string
    year: number
    month: number // 1-12
    status: PeriodStatus
    checks: {
        bankReconciled: boolean
        vatReported: boolean
        declarationsDone: boolean
        allCategorized: boolean
        notes?: string
    }
    locked_at?: string
    locked_by?: string
}

const supabase = getSupabaseClient()

export function useMonthClosing() {
    const { verifications } = useVerifications()
    const { company } = useCompany()
    const [periods, setPeriods] = useState<MonthStatus[]>([])

    // Load periods from Supabase
    useEffect(() => {
        if (!company?.id) return

        let isMounted = true
        async function loadPeriods() {
            try {
                // Fetch ONLY monthly periods from the consolidated table
                const { data, error } = await supabase
                    .from('financialperiods')
                    .select('*')
                    .eq('type', 'monthly')

                if (isMounted) {
                    if (!error && data) {
                        setPeriods(data.map(p => {
                            // Map 2024-M01 -> year 2024, month 1
                            const parts = p.id.split('-M')
                            const year = parseInt(parts[0])
                            const month = parseInt(parts[1])

                            return {
                                id: p.id,
                                year,
                                month,
                                // status in DB is 'open', 'closed', 'submitted'
                                // we map 'closed' to 'locked' for our UI
                                status: p.status === 'closed' ? 'locked' : (p.status as PeriodStatus),
                                checks: (p.reconciliation_checks as unknown as MonthStatus['checks']) || { bankReconciled: false, vatReported: false, declarationsDone: false, allCategorized: false },
                                locked_at: p.locked_at || undefined,
                                locked_by: p.locked_by || undefined
                            }
                        }))
                    }
                }
            } catch (err) {
                console.error("Error loading periods:", err)
            }
        }

        loadPeriods()
        return () => { isMounted = false }
    }, [company?.id])

    const getPeriod = (year: number, month: number) => {
        return periods.find(p => p.year === year && p.month === month) || {
            year,
            month,
            status: 'open' as PeriodStatus,
            checks: {
                bankReconciled: false,
                vatReported: false,
                declarationsDone: false,
                allCategorized: false
            }
        }
    }

    const savePeriod = async (year: number, month: number, updates: Partial<MonthStatus>) => {
        if (!company?.id) return

        const current = getPeriod(year, month)
        const updated = { ...current, ...updates }
        const periodId = `${year}-M${month.toString().padStart(2, '0')}`

        // Optimistic UI
        setPeriods(prev => {
            const index = prev.findIndex(p => p.year === year && p.month === month)
            if (index >= 0) {
                const n = [...prev]
                n[index] = updated
                return n
            } else {
                return [...prev, updated]
            }
        })

        // Persist to financial_periods
        try {
            // Map our UI 'locked' back to DB 'closed'
            const dbStatus = updated.status === 'locked' ? 'closed' : updated.status

            const { error } = await supabase
                .from('financialperiods')
                .upsert({
                    id: periodId,
                    company_id: company.id,
                    type: 'monthly',
                    name: `Månadsbokslut ${year}-${month}`,
                    start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
                    end_date: `${year}-${month.toString().padStart(2, '0')}-28`, // simplified
                    status: dbStatus,
                    reconciliation_checks: updated.checks,
                    locked_at: updated.locked_at,
                    locked_by: updated.locked_by
                }, { onConflict: 'id' })

            if (error) {
                console.error("Failed to save period:", error)
            }
        } catch (err) {
            console.error("Upsert error:", err)
        }
    }

    const lockPeriod = (year: number, month: number) => {
        savePeriod(year, month, {
            status: 'locked',
            locked_at: new Date().toISOString()
        })
    }

    const unlockPeriod = (year: number, month: number) => {
        savePeriod(year, month, { status: 'open', locked_at: undefined })
    }

    const toggleCheck = (year: number, month: number, check: keyof MonthStatus['checks']) => {
        const period = getPeriod(year, month)
        savePeriod(year, month, {
            checks: {
                ...period.checks,
                [check]: !period.checks[check]
            }
        })
    }

    const saveNotes = (year: number, month: number, notes: string) => {
        const period = getPeriod(year, month)
        savePeriod(year, month, {
            checks: {
                ...period.checks,
                notes
            }
        })
    }

    // Calculate Real Data for Checks (Bank Diff)
    const getVerificationStats = (year: number, month: number) => {
        // Filter verifications for this month
        const monthVerifications = verifications.filter(v => {
            const d = new Date(v.date)
            return d.getFullYear() === year && (d.getMonth() + 1) === month
        })

        const verificationCount = monthVerifications.length

        // Count discrepancies: verifications where debit != credit (unbalanced)
        let discrepancyCount = 0
        for (const v of monthVerifications) {
            if (v.rows && Array.isArray(v.rows)) {
                const totalDebit = v.rows.reduce((sum: number, row: { debit?: number }) => sum + (row.debit || 0), 0)
                const totalCredit = v.rows.reduce((sum: number, row: { credit?: number }) => sum + (row.credit || 0), 0)
                // Allow small floating point differences
                if (Math.abs(totalDebit - totalCredit) > 0.01) {
                    discrepancyCount++
                }
            }
        }

        return {
            verificationCount,
            discrepancyCount
        }
    }

    return {
        getPeriod,
        lockPeriod,
        unlockPeriod,
        toggleCheck,
        saveNotes,
        getVerificationStats
    }
}
