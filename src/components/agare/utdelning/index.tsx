"use client"

import { useDividendLogic } from "./use-dividend-logic"
import { UtdelningStats } from "./utdelning-stats"
import { RulesCard } from "./rules-card"
import { DividendCalculator } from "./dividend-calculator"
import { DividendHistoryCard } from "./dividend-history-card"

export function UtdelningContent() {
    const { stats, salaryBasis, realDividendHistory, registerDividend } = useDividendLogic()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Utdelning</h2>
                        <p className="text-muted-foreground mt-1">
                            Hantera utdelning och K10-underlag.
                        </p>
                    </div>
                </div>
            </div>

            <UtdelningStats stats={stats} />
            
            <RulesCard />

            <div className="grid grid-cols-2 gap-6">
                <DividendCalculator salaryBasis={salaryBasis} />
                <DividendHistoryCard 
                    history={realDividendHistory} 
                    onRegister={registerDividend} 
                />
            </div>
        </div>
    )
}
