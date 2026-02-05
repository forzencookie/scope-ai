"use client"

import { useState } from "react"
import { Calculator, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"

// Logic
import { useK10Calculation } from "./use-k10-calculation"

// Components
import { K10Stats } from "./components/K10Stats"
import { K10Breakdown } from "./components/K10Breakdown"
import { K10History } from "./components/K10History"
import { K10WizardDialog } from "../dialogs/k10-wizard-dialog"

export function K10Content() {
    const navigateToAI = useNavigateToAIChat()
    const [isWizardOpen, setIsWizardOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    // Logic Hook
    const { k10Data, taxYear } = useK10Calculation()

    const handleWizardConfirm = () => {
        setIsWizardOpen(false)
        setRefreshKey(prev => prev + 1) // Trigger history refresh
    }

    return (
        <TooltipProvider>
            <main className="flex-1 flex flex-col p-4 md:p-6">
                <div className="w-full space-y-4 md:space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">K10 - Kvalificerade andelar</h2>
                            <p className="text-muted-foreground">
                                Blankett K10 för fåmansföretag. Beräkna gränsbeloppet för 3:12-reglerna.
                            </p>
                        </div>
                        <Button onClick={() => setIsWizardOpen(true)} size="sm" className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Skapa blankett</span>
                            <span className="sm:hidden">Ny</span>
                        </Button>
                    </div>

                    {/* Stats Grid */}
                    <K10Stats data={k10Data} deadline={taxYear.deadlineLabel} />

                    <SectionCard
                        title="Optimera K10 med AI"
                        description="Låt AI analysera ditt löneunderlag och maximera ditt gränsbelopp för lågbeskattad utdelning."
                        variant="ai"
                        icon={Calculator}
                        actionLabel="Beräkna gränsbelopp"
                        onAction={() => navigateToAI(getDefaultAIContext("k10"))}
                    />

                    <div className="border-b-2 border-border/60" />

                    {/* Breakdown Calculation */}
                    <K10Breakdown data={k10Data} />

                    {/* History Table */}
                    <K10History key={refreshKey} />
                </div>
            </main>

            <K10WizardDialog
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onConfirm={handleWizardConfirm}
                data={{
                    taxYear: taxYear.year,
                    deadline: taxYear.deadlineLabel,
                    k10Data: k10Data
                }}
            />
        </TooltipProvider >
    )
}
