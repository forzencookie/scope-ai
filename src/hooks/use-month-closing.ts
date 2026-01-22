"use client"

import { useVerifications } from "./use-verifications"
import { useCompany } from "@/providers/company-provider"
import { createClient } from "@/lib/supabase/client"

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
    }
    locked_at?: string
    locked_by?: string
}

const supabase = createClient()

export function useMonthClosing() {
    const { verifications } = useVerifications()
    const { company } = useCompany()
    const [periods, setPeriods] = useState<MonthStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load periods from Supabase
    useEffect(() => {
        if (!company?.id) return

        let isMounted = true
        async function loadPeriods() {
            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('month_closings')
                    .select('*')
                    .eq('company_id', company.id)

                if (isMounted) {
                    if (!error && data) {
                        setPeriods(data.map(p => ({
                            ...p,
                            checks: p.checks || { bankReconciled: false, vatReported: false, declarationsDone: false, allCategorized: false }
                        })))
                    }
                    setIsLoading(false)
                }
            } catch (err) {
                console.error("Error loading periods:", err)
                if (isMounted) setIsLoading(false)
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

        // Persist to Supabase
        try {
            const { error } = await supabase
                .from('month_closings')
                .upsert({
                    company_id: company.id,
                    year,
                    month,
                    status: updated.status,
                    checks: updated.checks,
                    locked_at: updated.locked_at,
                    locked_by: updated.locked_by
                }, { onConflict: 'company_id,year,month' })

            if (error) {
                console.error("Failed to save period:", error)
                // Rollback could be implemented here
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

    // derived: Calculate status based on checks? Or just let user control?
    // Let's keep it manual but powered by checks.

    // Calculate Real Data for Checks (Bank Diff)
    const getVerificationStats = (year: number, month: number) => {
        // Filter verifications for this month
        const monthVerifications = verifications.filter(v => {
            const d = new Date(v.date)
            return d.getFullYear() === year && (d.getMonth() + 1) === month
        })

        const uncategorizedCount = 0 // We don't have uncategorized concept yet in verifications directly
        const verificationCount = monthVerifications.length

        // Ledger Balance for 1930 at end of month
        // This is expensive to calc correctly without running total, but YTD is doable.

        return {
            verificationCount,
            uncategorizedCount
        }
    }

    return {
        getPeriod,
        lockPeriod,
        unlockPeriod,
        toggleCheck,
        getVerificationStats
    }
}
