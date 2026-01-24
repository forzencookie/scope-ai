"use client"

import { Send, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai-context"

// Logic
import { useK10Calculation } from "./use-k10-calculation"

// Components
import { K10Stats } from "./components/K10Stats"
import { K10Breakdown } from "./components/K10Breakdown"
import { K10History } from "./components/K10History"

export function K10Content() {
    const toast = useToast()
    const navigateToAI = useNavigateToAIChat()
    
    // Logic Hook
    const { k10Data, taxYear } = useK10Calculation()

    const handleSubmit = () => {
        toast.info("Kommer snart", "Integration med Skatteverket är under utveckling.")
    }

    const handleExport = () => {
        toast.info("Exporterar SRU", "K10 laddas ner som SRU-fil för import till Skatteverket...")
    }

    return (
        <TooltipProvider>
            <main className="flex-1 flex flex-col p-6">
                <div className="max-w-6xl w-full space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">K10 - Kvalificerade andelar</h2>
                            <p className="text-muted-foreground">
                                Blankett K10 för fåmansföretag. Beräkna gränsbeloppet för 3:12-reglerna.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSubmit} className="w-full sm:w-auto">
                                <Send className="h-4 w-4 mr-2" />
                                Skicka till Skatteverket
                            </Button>
                        </div>
                    </div>

                    <SectionCard
                        title="Optimera K10 med AI"
                        description="Låt AI analysera ditt löneunderlag och maximera ditt gränsbelopp för lågbeskattad utdelning."
                        variant="ai"
                        icon={Calculator}
                        actionLabel="Beräkna gränsbelopp"
                        onAction={() => navigateToAI(getDefaultAIContext("k10"))}
                    />

                    {/* Stats Grid */}
                    <K10Stats data={k10Data} deadline={taxYear.deadline} />

                    {/* Section Separator */}
                    <div className="border-b-2 border-border/60" />

                    {/* Breakdown Calculation */}
                    <K10Breakdown data={k10Data} />

                    {/* History Table */}
                    <K10History onExport={handleExport} />
                </div>
            </main>
        </TooltipProvider >
    )
}
