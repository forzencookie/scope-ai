"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { useDividendLogic } from "./use-dividend-logic"
import { UtdelningStats } from "./utdelning-stats"
import { RulesCard } from "./rules-card"
import { DividendCalculator } from "./dividend-calculator"
import { UtdelningsTable } from "./dividend-table"
import { RegisterDividendDialog } from "./register-dividend-dialog"

export function UtdelningContent() {
    const { stats, k10Data, realDividendHistory, registerDividend } = useDividendLogic()
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)

    return (
        <div className="space-y-6">
            <PageHeader
                title="Utdelning"
                subtitle="Hantera utdelning och K10-underlag."
                actions={
                    <Button size="sm" onClick={() => setShowRegisterDialog(true)}>
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Registrera utdelning</span>
                        <span className="sm:hidden">Ny</span>
                    </Button>
                }
            />

            <UtdelningStats stats={stats} />

            <RulesCard />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <h2 className="font-medium mb-3">Utdelningshistorik</h2>
                    <UtdelningsTable data={realDividendHistory} />
                </div>
                <div className="shrink-0 lg:w-72">
                    <DividendCalculator k10Data={k10Data} />
                </div>
            </div>

            <RegisterDividendDialog
                open={showRegisterDialog}
                onOpenChange={setShowRegisterDialog}
                onRegister={registerDividend}
            />
        </div>
    )
}
