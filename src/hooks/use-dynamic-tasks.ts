
import { useMemo } from 'react'
import { useTransactions } from '@/hooks/use-transactions-query'
import { payslips, agiReports } from '@/components/loner/constants'
import { TRANSACTION_STATUS_LABELS } from '@/lib/localization'

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

export function useDynamicTasks() {
    const { transactions, isLoading: isLoadingTransactions } = useTransactions()

    // Derived state for goals and tasks
    const goals = useMemo<DynamicGoal[]>(() => {
        const newGoals: DynamicGoal[] = []

        // 1. Bokföring Goal
        const pendingTransactions = transactions ? transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.TO_RECORD).length : 0
        // TODO: Fetch invoice counts from API in future
        const draftInvoices = 0
        const overdueInvoices = 0

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
        // Calculate next VAT deadline (Simplified logic)
        // In a real app use VatProcessor.getVatDeadline logic
        const now = new Date()
        const currentYear = now.getFullYear()
        let vatDeadline = new Date(currentYear, 1, 12) // Feb 12
        let vatPeriod = "Q4"

        // Simple logic: if after Feb 12, next is May 12 (Q1)
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
        const pendingPayslips = payslips.filter(p => p.status === 'pending').length
        const pendingAgi = agiReports.filter(a => a.status === 'pending').length

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

        if (pendingAgi > 0) {
            lonerTasks.push({
                id: 'lon-2',
                title: `AGI-rapport att skicka in`,
                completed: false,
                href: '/dashboard/rapporter?tab=agi',
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

    }, [transactions])

    return {
        goals,
        isLoading: isLoadingTransactions,
        refresh: () => { } // No-op as useTransactions updates automatically or via its own refetch
    }
}
