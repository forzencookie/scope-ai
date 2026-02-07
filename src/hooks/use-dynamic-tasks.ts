
import { useMemo, useState, useEffect } from 'react'
import { useTransactions } from '@/hooks/use-transactions-query'
import { TRANSACTION_STATUS_LABELS } from '@/lib/localization'
import { getSupabaseClient } from '@/lib/database/supabase'

export interface DynamicTask {
    id: string
    title: string
    completed: boolean
    recurring?: boolean
    href?: string
    category: 'bokforing' | 'rapporter' | 'loner' | 'agare'
}

export interface DynamicGoal {
    id: string
    name: string
    target: string
    category: 'bokforing' | 'rapporter' | 'loner' | 'agare'
    tasks: DynamicTask[]
}

interface StatCounts {
    draftInvoices: number
    overdueInvoices: number
    pendingPayslips: number
}

function useStatCounts(): StatCounts & { isLoading: boolean } {
    const [counts, setCounts] = useState<StatCounts>({
        draftInvoices: 0,
        overdueInvoices: 0,
        pendingPayslips: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchCounts() {
            const supabase = getSupabaseClient()
            const today = new Date().toISOString().split('T')[0]

            try {
                const [draftRes, overdueRes, payslipRes] = await Promise.all([
                    // Draft customer invoices
                    supabase
                        .from('customerinvoices')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'DRAFT'),
                    // Overdue unpaid invoices
                    supabase
                        .from('customerinvoices')
                        .select('id', { count: 'exact', head: true })
                        .lt('due_date', today)
                        .not('status', 'in', '("PAID","CANCELLED")'),
                    // Pending payslips
                    supabase
                        .from('payslips')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'draft'),
                ])

                setCounts({
                    draftInvoices: draftRes.count || 0,
                    overdueInvoices: overdueRes.count || 0,
                    pendingPayslips: payslipRes.count || 0,
                })
            } catch (err) {
                console.error('Failed to fetch stat counts:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCounts()
    }, [])

    return { ...counts, isLoading }
}

export function useDynamicTasks() {
    const { transactions, isLoading: isLoadingTransactions } = useTransactions()
    const { draftInvoices, overdueInvoices, pendingPayslips, isLoading: isLoadingCounts } = useStatCounts()

    // Derived state for goals and tasks
    const goals = useMemo<DynamicGoal[]>(() => {
        const newGoals: DynamicGoal[] = []

        // 1. Bokföring Goal
        const pendingTransactions = transactions ? transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.TO_RECORD).length : 0

        const bokforingTasks: DynamicTask[] = []

        if (pendingTransactions > 0) {
            bokforingTasks.push({
                id: 'bok-1',
                title: `${pendingTransactions} transaktioner väntar på bokföring`,
                completed: false,
                href: '/dashboard/bokforing?tab=transaktioner',
                category: 'bokforing'
            })
        } else {
            bokforingTasks.push({
                id: 'bok-1-done',
                title: `Alla transaktioner är bokförda`,
                completed: true,
                href: '/dashboard/bokforing?tab=transaktioner',
                category: 'bokforing'
            })
        }

        if (draftInvoices > 0) {
            bokforingTasks.push({
                id: 'bok-2',
                title: `${draftInvoices} kundfakturor att skicka`,
                completed: false,
                href: '/dashboard/bokforing?tab=kundfakturor',
                category: 'bokforing'
            })
        }

        if (overdueInvoices > 0) {
            bokforingTasks.push({
                id: 'bok-3',
                title: `${overdueInvoices} förfallna fakturor att följa upp`,
                completed: false,
                href: '/dashboard/bokforing?tab=kundfakturor',
                category: 'bokforing'
            })
        }

        newGoals.push({
            id: 'goal-bokforing',
            name: 'Ordning på ekonomin',
            target: 'Ha koll på transaktioner och fakturor',
            category: 'bokforing',
            tasks: bokforingTasks
        })

        // 2. Rapporter Goal
        const now = new Date()
        const currentYear = now.getFullYear()
        let vatDeadline = new Date(currentYear, 1, 12) // Feb 12
        let vatPeriod = "Q4"

        if (now > new Date(currentYear, 1, 12)) {
            vatDeadline = new Date(currentYear, 4, 12) // May 12
            vatPeriod = "Q1"
        }
        if (now > new Date(currentYear, 4, 12)) {
            vatDeadline = new Date(currentYear, 7, 17) // Aug 17
            vatPeriod = "Q2"
        }
        if (now > new Date(currentYear, 7, 17)) {
            vatDeadline = new Date(currentYear, 10, 12) // Nov 12
            vatPeriod = "Q3"
        }
        if (now > new Date(currentYear, 10, 12)) {
            vatDeadline = new Date(currentYear + 1, 1, 12) // Feb 12 next year
            vatPeriod = "Q4"
        }

        const daysToDeadline = Math.ceil((vatDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const vatDeadlineStr = vatDeadline.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })

        newGoals.push({
            id: 'goal-rapporter',
            name: `Momsdeklaration ${vatPeriod}`,
            target: `Ska vara inne senast ${vatDeadlineStr} (${daysToDeadline} dagar kvar)`,
            category: 'rapporter',
            tasks: [
                {
                    id: 'rap-1',
                    title: 'Kontrollera momssaldo',
                    completed: false,
                    href: '/dashboard/rapporter?tab=momsdeklaration',
                    category: 'rapporter'
                },
                {
                    id: 'rap-2',
                    title: 'Granska avdragsposter',
                    completed: false,
                    href: '/dashboard/rapporter?tab=momsdeklaration',
                    category: 'rapporter'
                }
            ]
        })

        // 3. Löner Goal
        const lonerTasks: DynamicTask[] = []

        if (pendingPayslips > 0) {
            lonerTasks.push({
                id: 'lon-1',
                title: `Godkänn ${pendingPayslips} lönebesked`,
                completed: false,
                href: '/dashboard/loner?tab=lonebesked',
                category: 'loner'
            })
        } else {
            lonerTasks.push({
                id: 'lon-1-done',
                title: `Alla löner är hanterade`,
                completed: true,
                href: '/dashboard/loner?tab=lonebesked',
                category: 'loner'
            })
        }

        newGoals.push({
            id: 'goal-loner',
            name: 'Löneadministration',
            target: 'Utbetalning den 25:e varje månad',
            category: 'loner',
            tasks: lonerTasks
        })

        return newGoals

    }, [transactions, draftInvoices, overdueInvoices, pendingPayslips])

    return {
        goals,
        isLoading: isLoadingTransactions || isLoadingCounts,
        refresh: () => { }
    }
}
