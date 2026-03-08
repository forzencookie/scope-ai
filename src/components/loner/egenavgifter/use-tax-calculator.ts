import { useState, useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"
import { calculateEgenavgifter, type EgenavgifterRates } from "@/lib/egenavgifter"

/**
 * @deprecated Use useAllTaxRates() hook instead. Kept for backwards compatibility with components
 * that import TAX_RATES directly — these should be migrated to the hook.
 */
export const TAX_RATES = {
  egenavgifter: {
    sjukforsakring: 0.0388,
    foraldraforsakring: 0.0260,
    alderspension: 0.1021,
    efterlevandepension: 0.0070,
    arbetsmarknadsavgift: 0.0264,
    arbetsskadeavgift: 0.0020,
    allmänLöneAvgift: 0.1150,
  },
  fullRate: 0.2897,
  reducedRate: 0.1021,
  karensReduction: 0.0076,
}

export interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  profit: number
  egenavgifter: number
}

export function useTaxCalculator() {
    const { verifications } = useVerifications()
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())
    const [annualProfit, setAnnualProfit] = useState<number>(500000)
    const [isReduced, setIsReduced] = useState(false)
    const [includeKarensReduction, setIncludeKarensReduction] = useState(false)

    // Calculate Real Profit from Ledger (YTD)
    const realProfit = useMemo(() => {
        let revenue = 0
        let expenses = 0

        verifications.forEach(v => {
          v.rows.forEach(r => {
            const acc = parseInt(r.account)
            if (acc >= 3000 && acc <= 3999) {
              revenue += (r.credit - r.debit)
            } else if (acc >= 4000 && acc <= 7999) {
              expenses += (r.debit - r.credit)
            }
          })
        })

        return revenue - expenses
    }, [verifications])

    const calculation = useMemo(() => {
        if (!taxRates) {
          return { rate: 0, avgifter: 0, nettoEfterAvgifter: annualProfit, monthlyNet: Math.round(annualProfit / 12), components: [], error: 'Skattesatser ej tillgängliga' }
        }

        // Delegate to canonical calculation function
        const rates: EgenavgifterRates = taxRates.egenavgiftComponents as unknown as EgenavgifterRates
        const result = calculateEgenavgifter(annualProfit, rates, {
            reduced: isReduced,
            karens: includeKarensReduction,
            karensReduction: taxRates.egenavgifterKarensReduction,
            reducedRate: taxRates.egenavgifterReduced,
        })

        return {
          rate: result.rate,
          avgifter: result.avgifter,
          nettoEfterAvgifter: result.nettoEfterAvgifter,
          monthlyNet: result.monthlyNet,
          components: result.components,
        }
      }, [annualProfit, isReduced, includeKarensReduction, taxRates])

    const monthlyData: MonthlyData[] = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
        const monthlyStats = Array(12).fill(0).map(() => ({ revenue: 0, expenses: 0 }))
        const currentYear = new Date().getFullYear()

        verifications.forEach(v => {
            const d = new Date(v.date)
            if (d.getFullYear() !== currentYear) return

            const monthIndex = d.getMonth()
            v.rows.forEach(r => {
                const acc = parseInt(r.account)
                if (acc >= 3000 && acc <= 3999) {
                   monthlyStats[monthIndex].revenue += (r.credit - r.debit)
                } else if (acc >= 4000 && acc <= 7999) {
                   monthlyStats[monthIndex].expenses += (r.debit - r.credit)
                }
            })
        })

        // Calculate derived stats
        return months.map((month, i) => {
            const s = monthlyStats[i]
            const profit = s.revenue - s.expenses
            // Estimate egenavgifter for that month based on current rate
            const egenavgifter = Math.round(profit * calculation.rate)
            return {
                month,
                revenue: s.revenue,
                expenses: s.expenses,
                profit,
                egenavgifter
            }
        })
    }, [verifications, calculation.rate])

    return {
        annualProfit,
        setAnnualProfit,
        isReduced,
        setIsReduced,
        includeKarensReduction,
        setIncludeKarensReduction,
        realProfit,
        calculation,
        monthlyData
    }
}
