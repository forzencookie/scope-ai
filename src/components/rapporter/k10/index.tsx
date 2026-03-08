"use client"

import { Bot, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { YearSlider } from "@/components/shared"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useCompany } from "@/providers/company-provider"
import { useToast } from "@/components/ui/toast"
import { downloadSRUPackage, createK10Declaration } from "@/lib/generators/sru-generator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Logic
import { useK10Calculation } from "./use-k10-calculation"

// Components
import { K10Stats } from "./components/K10Stats"
import { K10Breakdown } from "./components/K10Breakdown"
import { K10History } from "./components/K10History"

export function K10Content() {
    const navigateToAI = useNavigateToAIChat()
    const { company } = useCompany()
    const toast = useToast()

    // Logic Hook
    const {
        k10Data, taxYear, setYear, availableYears, isLoading,
        shareholders, selectedShareholderIdx, setSelectedShareholderIdx
    } = useK10Calculation()

    const selectedShareholder = shareholders.length > 0
        ? shareholders[selectedShareholderIdx] || shareholders[0]
        : null

    const handleExportSRU = async () => {
        toast.info("Exporterar", "Förbereder K10 SRU-filer...")
        try {
            const declaration = createK10Declaration({
                orgnr: company?.orgNumber || '000000-0000',
                companyName: company?.name || 'Företag',
                taxYear: taxYear.year,
                omkostnadsbelopp: k10Data.omkostnadsbelopp,
                agarandel: k10Data.agarandel,
                schablonbelopp: k10Data.schablonbelopp,
                lonebaseratUtrymme: k10Data.lonebaseratUtrymme,
                sparatUtdelningsutrymme: k10Data.sparatUtdelningsutrymme,
                gransbelopp: k10Data.gransbelopp,
                totalDividends: k10Data.totalDividends,
                remainingUtrymme: k10Data.remainingUtrymme,
                egenLon: k10Data.egenLon,
                klararLonekrav: k10Data.klararLonekrav,
            })

            await downloadSRUPackage({
                sender: {
                    orgnr: company?.orgNumber || '000000-0000',
                    name: company?.name || 'Företag',
                },
                declarations: [declaration],
            })
            toast.success("Klart", "K10 SRU-filer har laddats ner.")
        } catch {
            toast.error("Fel", "Kunde inte generera SRU-filer.")
        }
    }

    return (
        <TooltipProvider>
            <div className="w-full space-y-4 md:space-y-6">
                <div className="w-full space-y-4 md:space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">K10 - Kvalificerade andelar</h2>
                            <p className="text-muted-foreground">
                                Blankett K10 för fåmansföretag. Beräkna gränsbeloppet för 3:12-reglerna.
                            </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto items-center">
                            <YearSlider
                                year={taxYear.year}
                                onYearChange={setYear}
                                minYear={availableYears[availableYears.length - 1]}
                                maxYear={availableYears[0]}
                            />
                            {/* Shareholder selector */}
                            {shareholders.length > 1 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                            {selectedShareholder?.name || "Välj delägare"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Välj delägare</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {shareholders.map((s, idx) => (
                                            <DropdownMenuItem
                                                key={s.id}
                                                onClick={() => setSelectedShareholderIdx(idx)}
                                                className={idx === selectedShareholderIdx ? "bg-accent" : ""}
                                            >
                                                {s.name} ({s.shares_percentage || Math.round((s.shares_count / shareholders.reduce((sum, sh) => sum + (sh.shares_count || 0), 0)) * 100)}%)
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <Button variant="outline" onClick={handleExportSRU} size="sm" className="w-full sm:w-auto">
                                <FileDown className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Exportera SRU</span>
                                <span className="sm:hidden">SRU</span>
                            </Button>
                            <Button onClick={() => navigateToAI(getDefaultAIContext('k10'))} size="sm" className="w-full sm:w-auto">
                                <Bot className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Skapa blankett</span>
                                <span className="sm:hidden">Ny</span>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <K10Stats data={k10Data} deadline={taxYear.deadlineLabel} isLoading={isLoading} />

                    <div className="border-b-2 border-border/60" />

                    {/* Breakdown Calculation */}
                    <K10Breakdown data={k10Data} />

                    {/* History Table */}
                    <K10History />
                </div>
            </div>
        </TooltipProvider>
    )
}
