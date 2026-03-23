
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTransactions } from '@/hooks/use-transactions-query'
import { TRANSACTION_STATUS_LABELS } from '@/lib/localization'
import { useCompany } from '@/providers/company-provider'
import { invoiceService } from '@/services/invoicing/invoice-service'
import { payrollService } from '@/services/payroll/payroll-service'

export interface DynamicTask {
    id: string
    title: string
    completed: boolean
    recurring?: boolean
    href?: string
    category: 'bokforing' | 'rapporter' | 'loner' | 'agare'
    /** Rich prompt for Scooby — tells it what data to fetch, not just a label */
    prompt?: string
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
    totalTransactions: number
    totalVerifications: number
}

export const dynamicTaskQueryKeys = {
    all: ["dynamic-tasks"] as const,
    statCounts: () => [...dynamicTaskQueryKeys.all, "stat-counts"] as const,
}

function useStatCounts(): StatCounts & { isLoading: boolean } {
    const { data, isLoading } = useQuery<StatCounts>({
        queryKey: dynamicTaskQueryKeys.statCounts(),
        queryFn: async () => {
            const [draftRes, overdueRes, payslipRes] = await Promise.all([
                invoiceService.getDraftCount(),
                invoiceService.getOverdueCount(),
                payrollService.getPendingPayslipCount(),
            ])

            return {
                draftInvoices: draftRes,
                overdueInvoices: overdueRes,
                pendingPayslips: payslipRes,
                totalTransactions: 0,
                totalVerifications: 0,
            }
        },
        staleTime: 5 * 60 * 1000,
    })

    return {
        draftInvoices: data?.draftInvoices || 0,
        overdueInvoices: data?.overdueInvoices || 0,
        pendingPayslips: data?.pendingPayslips || 0,
        totalTransactions: data?.totalTransactions || 0,
        totalVerifications: data?.totalVerifications || 0,
        isLoading,
    }
}

export function useDynamicTasks() {
    const { transactions, isLoading: isLoadingTransactions } = useTransactions()
    const { draftInvoices, overdueInvoices, pendingPayslips, isLoading: isLoadingCounts } = useStatCounts()
    const { company, companyType } = useCompany()

    const goals = useMemo<DynamicGoal[]>(() => {
        // Gate: no goals if onboarding isn't complete (need at least company type and name)
        if (!company?.name || !companyType) return []

        const newGoals: DynamicGoal[] = []
        const totalTransactions = transactions?.length || 0

        // =====================================================================
        // 1. Bokföring — only if there are actual transactions to work with
        // =====================================================================
        const pendingTransactions = transactions
            ? transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.UNBOOKED).length
            : 0

        if (pendingTransactions > 0 || draftInvoices > 0 || overdueInvoices > 0) {
            const bokforingTasks: DynamicTask[] = []

            if (pendingTransactions > 0) {
                bokforingTasks.push({
                    id: 'bok-1',
                    title: `${pendingTransactions} transaktioner väntar på bokföring`,
                    completed: false,
                    href: '/dashboard/bokforing?tab=transaktioner',
                    category: 'bokforing',
                    prompt: `Jag har ${pendingTransactions} obokförda transaktioner. Hämta dem och hjälp mig bokföra dem en efter en.`,
                })
            }

            if (draftInvoices > 0) {
                bokforingTasks.push({
                    id: 'bok-2',
                    title: `${draftInvoices} kundfakturor att skicka`,
                    completed: false,
                    href: '/dashboard/bokforing?tab=kundfakturor',
                    category: 'bokforing',
                    prompt: `Jag har ${draftInvoices} utkast-fakturor. Visa dem och hjälp mig granska och skicka dem.`,
                })
            }

            if (overdueInvoices > 0) {
                bokforingTasks.push({
                    id: 'bok-3',
                    title: `${overdueInvoices} förfallna fakturor att följa upp`,
                    completed: false,
                    href: '/dashboard/bokforing?tab=kundfakturor',
                    category: 'bokforing',
                    prompt: `Jag har ${overdueInvoices} förfallna fakturor. Visa vilka kunder som är sena med betalningen och föreslå uppföljning.`,
                })
            }

            newGoals.push({
                id: 'goal-bokforing',
                name: 'Ordning på ekonomin',
                target: 'Ha koll på transaktioner och fakturor',
                category: 'bokforing',
                tasks: bokforingTasks,
            })
        }

        // =====================================================================
        // 2. Momsdeklaration — only if there's accounting data to declare
        // =====================================================================
        const hasAccountingData = totalTransactions > 0
        const hasMomsRegistration = company?.hasMomsRegistration !== false

        if (hasAccountingData && hasMomsRegistration) {
            const now = new Date()
            const currentYear = now.getFullYear()
            const vatFrequency = company?.vatFrequency || 'quarterly'

            let vatDeadline: Date
            let vatPeriod: string

            if (vatFrequency === 'monthly') {
                const currentMonth = now.getMonth()
                const declarationMonth = currentMonth
                const deadlineDay = (declarationMonth === 0 || declarationMonth === 7) ? 12 : 26
                vatDeadline = new Date(currentYear, currentMonth + 1, deadlineDay)
                if (vatDeadline <= now) {
                    const nextMonth = currentMonth + 1
                    const nextDeadlineDay = (nextMonth === 0 || nextMonth === 7) ? 12 : 26
                    vatDeadline = new Date(currentYear, nextMonth + 1, nextDeadlineDay)
                }
                const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
                vatPeriod = monthNames[vatDeadline.getMonth() - 1] || monthNames[11]
            } else if (vatFrequency === 'annually') {
                vatDeadline = new Date(currentYear, 1, 26)
                if (now > vatDeadline) {
                    vatDeadline = new Date(currentYear + 1, 1, 26)
                }
                vatPeriod = `${vatDeadline.getFullYear() - 1}`
            } else {
                vatDeadline = new Date(currentYear, 1, 12)
                vatPeriod = "Q4"

                if (now > new Date(currentYear, 1, 12)) {
                    vatDeadline = new Date(currentYear, 4, 12)
                    vatPeriod = "Q1"
                }
                if (now > new Date(currentYear, 4, 12)) {
                    vatDeadline = new Date(currentYear, 7, 17)
                    vatPeriod = "Q2"
                }
                if (now > new Date(currentYear, 7, 17)) {
                    vatDeadline = new Date(currentYear, 10, 12)
                    vatPeriod = "Q3"
                }
                if (now > new Date(currentYear, 10, 12)) {
                    vatDeadline = new Date(currentYear + 1, 1, 12)
                    vatPeriod = "Q4"
                }
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
                        href: '/dashboard/rapporter',
                        category: 'rapporter',
                        prompt: `Hämta min momsrapport för perioden ${vatPeriod}. Visa ingående och utgående moms, beräkna saldot, och flagga eventuella avvikelser.`,
                    },
                    {
                        id: 'rap-2',
                        title: 'Granska avdragsposter',
                        completed: false,
                        href: '/dashboard/rapporter',
                        category: 'rapporter',
                        prompt: `Hämta alla bokförda transaktioner med ingående moms för perioden ${vatPeriod}. Visa en sammanställning per kostnadskonto och flagga poster som kan vara privata utgifter eller saknar underlag.`,
                    },
                ],
            })
        }

        // =====================================================================
        // 3. Löner — only for companies with employees and pending work
        // =====================================================================
        if (company?.hasEmployees && pendingPayslips > 0) {
            newGoals.push({
                id: 'goal-loner',
                name: 'Löneadministration',
                target: 'Utbetalning den 25:e varje månad',
                category: 'loner',
                tasks: [
                    {
                        id: 'lon-1',
                        title: `Godkänn ${pendingPayslips} lönebesked`,
                        completed: false,
                        href: '/dashboard/loner?tab=lonebesked',
                        category: 'loner',
                        prompt: `Jag har ${pendingPayslips} lönebesked som väntar på godkännande. Visa dem och hjälp mig granska bruttolön, skatteavdrag och arbetsgivaravgifter.`,
                    },
                ],
            })
        }

        // =====================================================================
        // 4. Egenavgifter — EF/HB/KB only, and only with accounting data
        // =====================================================================
        if ((companyType === 'ef' || companyType === 'hb' || companyType === 'kb') && hasAccountingData) {
            newGoals.push({
                id: 'goal-egenavgifter',
                name: 'Egenavgifter',
                target: 'Beräkna och bokför månadsvis',
                category: 'loner',
                tasks: [
                    {
                        id: 'ega-1',
                        title: 'Beräkna preliminär F-skatt',
                        completed: false,
                        href: '/dashboard/loner?tab=egenavgifter',
                        category: 'loner',
                        prompt: 'Hämta min resultaträkning hittills i år och beräkna preliminär F-skatt och egenavgifter baserat på nuvarande vinst.',
                    },
                ],
            })
        }

        // =====================================================================
        // 5. Bolagsstämma — AB only, near fiscal year end
        // =====================================================================
        if (companyType === 'ab' && company?.fiscalYearEnd) {
            const now = new Date()
            const currentYear = now.getFullYear()
            const [fyMonth, fyDay] = company.fiscalYearEnd.split('-').map(Number)
            const fyEndDate = new Date(currentYear, (fyMonth || 12) - 1, fyDay || 31)
            const stammoDeadline = new Date(fyEndDate)
            stammoDeadline.setMonth(stammoDeadline.getMonth() + 6)
            const daysToStamma = Math.ceil((stammoDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysToStamma > 0 && daysToStamma <= 90) {
                newGoals.push({
                    id: 'goal-bolagsstamma',
                    name: 'Bolagsstämma',
                    target: `Ska hållas senast ${stammoDeadline.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} (${daysToStamma} dagar kvar)`,
                    category: 'agare',
                    tasks: [
                        {
                            id: 'stamma-1',
                            title: 'Förbered årsredovisning',
                            completed: false,
                            href: '/dashboard/rapporter',
                            category: 'agare',
                            prompt: 'Hjälp mig förbereda årsredovisningen. Hämta resultaträkning och balansräkning för senaste räkenskapsåret och identifiera vad som saknas.',
                        },
                    ],
                })
            }
        }

        return newGoals

    }, [transactions, draftInvoices, overdueInvoices, pendingPayslips, company, companyType])

    return {
        goals,
        isLoading: isLoadingTransactions || isLoadingCounts,
        refresh: () => { }
    }
}
