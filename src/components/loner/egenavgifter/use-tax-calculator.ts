import { useState, useMemo, useEffect } from "react"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"
import { taxCalculationService } from "@/services/tax/tax-calculation-service"

export interface MonthlyData {
    month: string
    profit: number
    egenavgifter: number
}

export function useTaxCalculator() {
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())
    const [annualProfit, setAnnualProfit] = useState<number>(500000)
    const [isReduced, setIsReduced] = useState(false)
    const [includeKarensReduction, setIncludeKarensReduction] = useState(false)
    
    // Real-world data from the Universal Service
    const [realProfit, setRealProfit] = useState(0)
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

    useEffect(() => {
        // Fetch real YTD profit from the deterministic service
        async function fetchRealProfit() {
            try {
                const year = new Date().getFullYear()
                const result = await taxCalculationService.getYTDProfitAndTax(year, {
                    isReduced,
                    includeKarensReduction
                })
                setRealProfit(result.realProfit)
            } catch (err) {
                console.error("Failed to fetch real profit:", err)
            }
        }
        fetchRealProfit()
    }, [isReduced, includeKarensReduction])

    const calculation = useMemo(() => {
        if (!taxRates) {
          return { rate: 0, avgifter: 0, nettoEfterAvgifter: annualProfit, monthlyNet: Math.round(annualProfit / 12), components: [], error: 'Skattesatser ej tillgängliga' }
        }

        // We use the annualProfit state (from UI slider) for the "Estimator" card
        // but realProfit for the "Current Status" card.
        const result = taxCalculationService.getYTDProfitAndTaxSync(annualProfit, taxRates, {
            isReduced,
            includeKarensReduction
        })

        return result.calculation
      }, [annualProfit, isReduced, includeKarensReduction, taxRates])

    return {
        annualProfit,
        setAnnualProfit,
        isReduced,
        setIsReduced,
        includeKarensReduction,
        setIncludeKarensReduction,
        realProfit,
        calculation,
        monthlyData // Future: populate from taxCalculationService.getMonthlyProfitTrend
    }
}
