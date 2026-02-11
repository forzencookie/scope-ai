"use client"

import { useState, useEffect, useCallback } from "react"
import { useVerifications } from "./use-verifications"
import { useCompany } from "@/providers/company-provider"
import { getSupabaseClient } from '@/lib/database/supabase'
import {
    getApplicableChecks,
    resolveChecks,
    getCheckProgress,
    migrateOldChecks,
    type ChecklistCompanyProfile,
    type ResolvedCheck,
} from '@/lib/checklist-engine'

export type PeriodStatus = 'open' | 'review' | 'locked'

export interface MonthStatus {
    id?: string
    year: number
    month: number // 1-12
    status: PeriodStatus
    manualChecks: Record<string, boolean>
    notes?: string
    dayNotes?: Record<string, string>
    locked_at?: string
    locked_by?: string
}

export function useMonthClosing() {
    const supabase = getSupabaseClient()
    const { verifications } = useVerifications()
    const { company } = useCompany()
    const [periods, setPeriods] = useState<MonthStatus[]>([])
    const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({})

    // Load periods from Supabase
    useEffect(() => {
        if (!company?.id) return

        let isMounted = true
        async function loadPeriods() {
            try {
                const { data, error } = await supabase
                    .from('financialperiods')
                    .select('*')
                    .eq('type', 'monthly')

                if (isMounted) {
                    if (!error && data) {
                        setPeriods(data.map(p => {
                            const parts = p.id.split('-M')
                            const year = parseInt(parts[0])
                            const month = parseInt(parts[1])

                            // Migrate old JSONB format to new format
                            const raw = (p.reconciliation_checks as Record<string, unknown>) || {}
                            const { manualChecks, notes } = migrateOldChecks(raw)
                            const dayNotes = (raw.dayNotes as Record<string, string>) || undefined

                            return {
                                id: p.id,
                                year,
                                month,
                                status: p.status === 'closed' ? 'locked' : (p.status as PeriodStatus),
                                manualChecks,
                                notes,
                                dayNotes,
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

    const getPeriod = (year: number, month: number): MonthStatus => {
        return periods.find(p => p.year === year && p.month === month) || {
            year,
            month,
            status: 'open' as PeriodStatus,
            manualChecks: {},
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

        // Persist — serialize manualChecks + notes into reconciliation_checks JSONB
        try {
            const dbStatus = updated.status === 'locked' ? 'closed' : updated.status

            const reconciliationPayload: Record<string, boolean | string | Record<string, string>> = { ...updated.manualChecks }
            if (updated.notes) {
                reconciliationPayload.notes = updated.notes
            }
            if (updated.dayNotes && Object.keys(updated.dayNotes).length > 0) {
                reconciliationPayload.dayNotes = updated.dayNotes
            }

            const { error } = await supabase
                .from('financialperiods')
                .upsert({
                    id: periodId,
                    company_id: company.id,
                    type: 'monthly',
                    name: `Månadsbokslut ${year}-${month}`,
                    start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
                    end_date: `${year}-${month.toString().padStart(2, '0')}-28`,
                    status: dbStatus,
                    reconciliation_checks: reconciliationPayload,
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

    const toggleCheck = (year: number, month: number, checkId: string) => {
        const period = getPeriod(year, month)
        savePeriod(year, month, {
            manualChecks: {
                ...period.manualChecks,
                [checkId]: !period.manualChecks[checkId]
            }
        })
    }

    const saveNotes = (year: number, month: number, notes: string) => {
        savePeriod(year, month, { notes })
    }

    const getDayNote = (year: number, month: number, day: number): string => {
        const period = getPeriod(year, month)
        return period.dayNotes?.[String(day)] || ""
    }

    const saveDayNote = (year: number, month: number, day: number, text: string) => {
        const period = getPeriod(year, month)
        const dayNotes = { ...period.dayNotes, [String(day)]: text }
        // Remove empty entries
        if (!text) delete dayNotes[String(day)]
        savePeriod(year, month, { dayNotes })
    }

    // Verification stats (discrepancy count for auto checks)
    const getVerificationStats = (year: number, month: number) => {
        const monthVerifications = verifications.filter(v => {
            const d = new Date(v.date)
            return d.getFullYear() === year && (d.getMonth() + 1) === month
        })

        const verificationCount = monthVerifications.length

        let discrepancyCount = 0
        for (const v of monthVerifications) {
            if (v.rows && Array.isArray(v.rows)) {
                const totalDebit = v.rows.reduce((sum: number, row: { debit?: number }) => sum + (row.debit || 0), 0)
                const totalCredit = v.rows.reduce((sum: number, row: { credit?: number }) => sum + (row.credit || 0), 0)
                if (Math.abs(totalDebit - totalCredit) > 0.01) {
                    discrepancyCount++
                }
            }
        }

        return { verificationCount, discrepancyCount }
    }

    // Set pending transaction counts (provided by caller to avoid duplicate fetches)
    const updatePendingCounts = useCallback((counts: Record<string, number>) => {
        setPendingCounts(counts)
    }, [])

    /**
     * Build fully resolved checks for a given month.
     * Returns the list of ResolvedCheck[] with auto values computed.
     */
    const getResolvedChecks = (year: number, month: number): ResolvedCheck[] => {
        if (!company) return []

        const profile: ChecklistCompanyProfile = {
            companyType: company.companyType,
            hasEmployees: company.hasEmployees,
            hasMomsRegistration: company.hasMomsRegistration,
            vatFrequency: company.vatFrequency,
            fiscalYearEnd: company.fiscalYearEnd,
        }

        const definitions = getApplicableChecks(profile, year, month)
        const period = getPeriod(year, month)

        const periodKey = `${year}-${String(month).padStart(2, '0')}`
        const pending = pendingCounts[periodKey] ?? 0

        const autoStates: Record<string, boolean> = {
            no_pending_transactions: pending === 0,
        }

        return resolveChecks(definitions, period.manualChecks, autoStates)
    }

    return {
        getPeriod,
        lockPeriod,
        unlockPeriod,
        toggleCheck,
        saveNotes,
        getDayNote,
        saveDayNote,
        getVerificationStats,
        getResolvedChecks,
        getCheckProgress,
        updatePendingCounts,
    }
}
