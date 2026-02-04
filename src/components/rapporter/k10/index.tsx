"use client"

import { Calculator, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useCompany } from "@/providers/company-provider"
import { downloadSRUPackage } from "@/lib/generators/sru-generator"
import type { SRUPackage, SRUDeclaration, SRUField } from "@/types/sru"

// Logic
import { useK10Calculation } from "./use-k10-calculation"

// Components
import { K10Stats } from "./components/K10Stats"
import { K10Breakdown } from "./components/K10Breakdown"
import { K10History } from "./components/K10History"

export function K10Content() {
    const toast = useToast()
    const navigateToAI = useNavigateToAIChat()
    const { company } = useCompany()
    
    // Logic Hook
    const { k10Data, taxYear } = useK10Calculation()

    const handleExport = async () => {
        toast.info("Exporterar SRU", "Förbereder K10 SRU-filer...")
        
        try {
            // Build K10 SRU fields based on calculated data
            const fields: SRUField[] = [
                { code: 100, value: k10Data.aktiekapital },              // Aktiekapital
                { code: 200, value: k10Data.omkostnadsbelopp },          // Omkostnadsbelopp
                { code: 300, value: k10Data.agarandel },                 // Ägarandel %
                { code: 400, value: k10Data.schablonbelopp },            // Schablonbelopp
                { code: 500, value: k10Data.lonebaseratUtrymme },        // Lönebaserat utrymme
                { code: 600, value: k10Data.gransbelopp },               // Gränsbelopp
                { code: 700, value: k10Data.totalDividends },            // Utdelning
                { code: 800, value: k10Data.remainingUtrymme },          // Sparat utrymme
            ]

            const declaration: SRUDeclaration = {
                blankettType: 'K10',
                period: `${taxYear.year}P4`,
                orgnr: company?.orgNumber || '556000-0000',
                name: company?.name || 'Företag AB',
                fields,
            }

            const pkg: SRUPackage = {
                sender: {
                    orgnr: company?.orgNumber || '556000-0000',
                    name: company?.name || 'Företag AB',
                    email: company?.email || '',
                },
                declarations: [declaration],
                generatedAt: new Date(),
                programName: 'Scope AI',
            }

            await downloadSRUPackage(pkg)
            toast.success("Klart", "K10 SRU-filer har laddats ner.")
        } catch {
            toast.error("Fel", "Kunde inte skapa SRU-filer.")
        }
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
                        <Button onClick={handleExport} size="sm" className="w-full sm:w-auto">
                            <FileDown className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Exportera SRU</span>
                            <span className="sm:hidden">SRU</span>
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
                    <K10History onExport={handleExport} />
                </div>
            </main>
        </TooltipProvider >
    )
}
