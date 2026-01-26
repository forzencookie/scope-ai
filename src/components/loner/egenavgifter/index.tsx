"use client"

import { TaxSettingsCard } from "./tax-settings-card"
import { CalculationResult } from "./calculation-result"
import { MonthlyTrend } from "./monthly-trend"
import { useTaxCalculator } from "./use-tax-calculator"
import { PageHeader } from "@/components/shared"

export function EgenavgifterCalculator() {
    const {
        annualProfit,
        setAnnualProfit,
        realProfit,
        isReduced,
        setIsReduced,
        includeKarensReduction,
        setIncludeKarensReduction,
        calculation,
        monthlyData
    } = useTaxCalculator()

    return (
        <div className="space-y-6">
             <PageHeader
                 title="Egenavgifter"
                 subtitle="Beräkna egenavgifter och sociala avgifter för enskild firma."
             />

             <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                      <TaxSettingsCard
                            annualProfit={annualProfit}
                            setAnnualProfit={setAnnualProfit}
                            realProfit={realProfit}
                            isReduced={isReduced}
                            setIsReduced={setIsReduced}
                            includeKarensReduction={includeKarensReduction}
                            setIncludeKarensReduction={setIncludeKarensReduction}
                      />
                </div>
                <div className="space-y-6">
                     <CalculationResult calculation={calculation} />
                </div>
             </div>
             <MonthlyTrend 
                monthlyData={monthlyData} 
                calculation={calculation} 
                annualProfit={annualProfit} 
             />
        </div>
    )
}
