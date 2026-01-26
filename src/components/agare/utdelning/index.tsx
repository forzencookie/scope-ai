"use client"

import { PageHeader } from "@/components/shared"
import { useDividendLogic } from "./use-dividend-logic"
import { UtdelningStats } from "./utdelning-stats"
import { RulesCard } from "./rules-card"
import { DividendCalculator } from "./dividend-calculator"
import { DividendHistoryCard } from "./dividend-history-card"

export function UtdelningContent() {
    const { stats, salaryBasis, realDividendHistory, registerDividend } = useDividendLogic()

    return (
        <div className="space-y-6">
            <PageHeader
                title="Utdelning"
                subtitle="Hantera utdelning och K10-underlag."
            />

            <UtdelningStats stats={stats} />
            
            <RulesCard />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <DividendCalculator salaryBasis={salaryBasis} />
                <DividendHistoryCard 
                    history={realDividendHistory} 
                    onRegister={registerDividend} 
                />
            </div>
        </div>
    )
}
