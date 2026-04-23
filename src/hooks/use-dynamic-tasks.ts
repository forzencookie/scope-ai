import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCompany } from '@/providers/company-provider'
import { invoiceService } from '@/services/invoicing/invoice-service'
import { payrollService } from '@/services/payroll/payroll-service'
import { createBrowserClient } from '@/lib/database/client'

export interface DynamicTask {
    id: string
    title: string
    completed: boolean
    recurring?: boolean
    category: 'bokforing' | 'rapporter' | 'loner' | 'agare'
    /** Rich prompt for Scooby — tells it exactly what data IDs to act on */
    prompt: string
}

export interface DynamicGoal {
    id: string
    name: string
    target: string
    category: 'bokforing' | 'rapporter' | 'loner' | 'agare'
    tasks: DynamicTask[]
}

interface TaskData {
    draftInvoiceIds: string[]
    overdueInvoiceIds: string[]
    pendingPayslipIds: string[]
    unbookedTransactionIds: string[]
    totalTransactionsCount: number
}

export const dynamicTaskQueryKeys = {
    all: ["dynamic-tasks"] as const,
    taskData: () => [...dynamicTaskQueryKeys.all, "task-data"] as const,
}

function useTaskData(): TaskData & { isLoading: boolean } {
    const { data, isLoading } = useQuery<TaskData>({
        queryKey: dynamicTaskQueryKeys.taskData(),
        queryFn: async () => {
            const supabase = createBrowserClient()
            
            // Fetch unbooked transactions directly manually since useTransactions is dead
            const txPromise = supabase
                .from('transactions')
                .select('id')
                .eq('status', 'obokförd')

            const txCountPromise = supabase
                .from('transactions')
                .select('id', { count: 'exact', head: true })

            const [draftRes, overdueRes, payslipRes, txRes, txCountRes] = await Promise.all([
                invoiceService.getDraftIds(),
                invoiceService.getOverdueIds(),
                payrollService.getPendingPayslipIds(),
                txPromise,
                txCountPromise
            ])

            return {
                draftInvoiceIds: draftRes || [],
                overdueInvoiceIds: overdueRes || [],
                pendingPayslipIds: payslipRes || [],
                unbookedTransactionIds: (txRes.data || []).map(r => r.id as string),
                totalTransactionsCount: txCountRes.count || 0,
            }
        },
        staleTime: 5 * 60 * 1000,
    })

    return {
        draftInvoiceIds: data?.draftInvoiceIds || [],
        overdueInvoiceIds: data?.overdueInvoiceIds || [],
        pendingPayslipIds: data?.pendingPayslipIds || [],
        unbookedTransactionIds: data?.unbookedTransactionIds || [],
        totalTransactionsCount: data?.totalTransactionsCount || 0,
        isLoading,
    }
}

export function useDynamicTasks() {
    const { draftInvoiceIds, overdueInvoiceIds, pendingPayslipIds, unbookedTransactionIds, totalTransactionsCount, isLoading: isLoadingCounts } = useTaskData()
    const { company, companyType } = useCompany()

    const goals = useMemo<DynamicGoal[]>(() => {
        // Gate: no goals if onboarding isn't complete (need at least company type and name)
        if (!company?.name || !companyType) return []

        const newGoals: DynamicGoal[] = []
        const totalTransactions = transactions?.length || 0

        // =====================================================================
        // 1. Bokföring — only if there are actual transactions to work with
        // =====================================================================
        if (unbookedTransactionIds.length > 0 || draftInvoiceIds.length > 0 || overdueInvoiceIds.length > 0) {
            const bokforingTasks: DynamicTask[] = []

            if (unbookedTransactionIds.length > 0) {
                bokforingTasks.push({
                    id: 'bok-1',
                    title: `${unbookedTransactionIds.length} transaktioner väntar på bokföring`,
                    completed: false,
                    category: 'bokforing',
                    prompt: `Hjälp mig bokföra följande obokförda transaktioner: [${unbookedTransactionIds.join(', ')}]`,
                })
            }

            if (draftInvoiceIds.length > 0) {
                bokforingTasks.push({
                    id: 'bok-2',
                    title: `${draftInvoiceIds.length} kundfakturor att skicka`,
                    completed: false,
                    category: 'bokforing',
                    prompt: `Hjälp mig granska och skicka följande utkast till kundfakturor: [${draftInvoiceIds.join(', ')}]`,
                })
            }

            if (overdueInvoiceIds.length > 0) {
                bokforingTasks.push({
                    id: 'bok-3',
                    title: `${overdueInvoiceIds.length} förfallna fakturor att följa upp`,
                    completed: false,
                    category: 'bokforing',
                    prompt: `Hjälp mig följa upp följande förfallna kundfakturor: [${overdueInvoiceIds.join(', ')}]`,
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
                        category: 'rapporter',
                        prompt: `Hämta min momsrapport för perioden ${vatPeriod}. Visa ingående och utgående moms, beräkna saldot, och flagga eventuella avvikelser.`,
                    },
                    {
                        id: 'rap-2',
                        title: 'Granska avdragsposter',
                        completed: false,
                        category: 'rapporter',
                        prompt: `Hämta alla bokförda transaktioner med ingående moms för perioden ${vatPeriod}. Visa en sammanställning per kostnadskonto och flagga poster som kan vara privata utgifter eller saknar underlag.`,
                    },
                ],
            })
        }

        // =====================================================================
        // 3. Löner — only for companies with employees and pending work
        // =====================================================================
        if (company?.hasEmployees && pendingPayslipIds.length > 0) {
            newGoals.push({
                id: 'goal-loner',
                name: 'Löneadministration',
                target: 'Utbetalning den 25:e varje månad',
                category: 'loner',
                tasks: [
                    {
                        id: 'lon-1',
                        title: `Godkänn ${pendingPayslipIds.length} lönebesked`,
                        completed: false,
                        category: 'loner',
                        prompt: `Hjälp mig granska och godkänna följande lönebesked: [${pendingPayslipIds.join(', ')}]`,
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
                            category: 'agare',
                            prompt: 'Hjälp mig förbereda årsredovisningen. Hämta resultaträkning och balansräkning för senaste räkenskapsåret och identifiera vad som saknas.',
                        },
                    ],
                })
            }
        }

        return newGoals

    }, [totalTransactionsCount, draftInvoiceIds, overdueInvoiceIds, pendingPayslipIds, unbookedTransactionIds, company, companyType])

    return {
        goals,
        isLoading: isLoadingCounts,
        refresh: () => { }
    }
}
