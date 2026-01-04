"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    TrendingUp,
    Clock,
    Send,
    FileDown,
    Calculator,
    AlertTriangle,
    Percent,
    ChevronUp,
    ChevronDown,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow
} from "@/components/ui/grid-table"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { k10Declarations, dividendHistory } from "@/components/loner/constants"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai-context"

// =============================================================================
// K10 Page - Blankett K10 for Fåmansföretag (3:12 rules)
// =============================================================================

// K10 is used by owners of closely held companies (fåmansföretag)
// to calculate gränsbelopp - the threshold for 20% vs 32%+ tax on dividends

interface K10Year {
    year: string
    status: "draft" | "submitted" | "approved"
    deadline: string
    gransbelopp: number
    usedAmount: number
    savedAmount: number
}

// Calculate gränsbelopp based on ownership and salary (simplified)
function useK10Calculation() {
    return useMemo(() => {
        // These would normally come from company data
        const aktiekapital = 50000
        const omkostnadsbelopp = 50000 // What you paid for shares
        const agarandel = 100 // Ownership percentage
        const arslonSumma = 520000 // Total salaries in company
        const egenLon = 45000 * 12 // Owner's salary

        // Schablonbelopp (2024 rate: 9.65% of IBB * ownership)
        const ibb2024 = 57300 // Inkomstbasbelopp 2024
        const schablonRate = 0.0965
        const schablonbelopp = Math.round(ibb2024 * 2.75 * schablonRate * (agarandel / 100))

        // Lönebaserat utrymme (simplified - 50% of salary portion)
        const lonebaseratUtrymme = Math.round(arslonSumma * 0.5 * (agarandel / 100))

        // Total gränsbelopp
        const gransbelopp = schablonbelopp + lonebaseratUtrymme

        // Get dividend history
        const totalDividends = dividendHistory
            .filter(d => d.year === "2024")
            .reduce((sum, d) => sum + d.amount, 0)

        const remainingUtrymme = gransbelopp - totalDividends

        return {
            year: "2024",
            schablonbelopp,
            lonebaseratUtrymme,
            gransbelopp,
            totalDividends,
            remainingUtrymme,
            aktiekapital,
            omkostnadsbelopp,
            agarandel,
            egenLon,
        }
    }, [])
}

// =============================================================================
// Main Component
// =============================================================================

export function K10Content() {
    const { addToast: toast } = useToast()
    const k10Data = useK10Calculation()
    const [showBreakdown, setShowBreakdown] = useState(false)
    const navigateToAI = useNavigateToAIChat()

    const handleSubmit = () => {
        toast({
            title: "K10 skickad",
            description: "Blankett K10 har skickats till Skatteverket.",
        })
    }

    const handleExport = () => {
        toast({
            title: "Exporterar SRU",
            description: "K10 laddas ner som SRU-fil för import till Skatteverket...",
        })
    }

    const [showAllHistory, setShowAllHistory] = useState(false)
    const displayedHistory = showAllHistory ? k10Declarations : k10Declarations.slice(0, 5)

    return (
        <TooltipProvider>
            <main className="flex-1 flex flex-col p-6">
                <div className="max-w-6xl w-full space-y-6">
                    {/* Page Heading */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">K10 - Kvalificerade andelar</h2>
                            <p className="text-muted-foreground">
                                Blankett K10 för fåmansföretag. Beräkna gränsbeloppet för 3:12-reglerna.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSubmit}>
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

                    <StatCardGrid columns={4}>
                        <StatCard
                            label="Inkomstår"
                            value="2024"
                            subtitle="Blankett K10"
                            headerIcon={Calendar}
                        />
                        <StatCard
                            label="Gränsbelopp"
                            value={formatCurrency(k10Data.gransbelopp)}
                            subtitle="Totalt beräknat"
                            headerIcon={TrendingUp}
                        />
                        <StatCard
                            label="Utnyttjat"
                            value={formatCurrency(k10Data.totalDividends)}
                            subtitle="I utdelning"
                            headerIcon={Percent}
                        />
                        <StatCard
                            label="Status"
                            value={INVOICE_STATUS_LABELS.DRAFT}
                            subtitle="Deadline: 2 maj 2025"
                            headerIcon={Clock}
                        />
                    </StatCardGrid>

                    {/* Section Separator */}
                    <div className="border-b-2 border-border/60" />

                    {/* Side-by-side layout: Gränsbelopp + Info Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gränsbelopp Calculation - Takes 2/3 width */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="flex items-center gap-2 font-semibold text-lg">
                                        <Calculator className="h-5 w-5" />
                                        Beräknat gränsbelopp
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Baserat på schablonregeln och lönebaserat utrymme
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                >
                                    {showBreakdown ? "Dölj detaljer" : "Visa beräkning"}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {showBreakdown && (
                                    <div className="space-y-3 pb-4 border-b border-border/60">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Schablonbelopp
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-muted-foreground">2,75 × IBB × 9,65% × ägarandel</span>
                                            <span className="font-medium tabular-nums">{formatCurrency(k10Data.schablonbelopp)}</span>
                                        </div>

                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
                                            Lönebaserat utrymme
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-muted-foreground">50% av lönesumma × ägarandel</span>
                                            <span className="font-medium tabular-nums">{formatCurrency(k10Data.lonebaseratUtrymme)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-border/60">
                                        <span className="font-medium">Totalt gränsbelopp</span>
                                        <span className="font-bold tabular-nums text-lg">{formatCurrency(k10Data.gransbelopp)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/60">
                                        <span className="text-muted-foreground">Utnyttjat i utdelning</span>
                                        <span className="font-bold tabular-nums text-lg text-red-600 dark:text-red-400">
                                            -{formatCurrency(k10Data.totalDividends)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="font-semibold">Kvar att använda</span>
                                        <span className={cn(
                                            "font-bold tabular-nums text-lg",
                                            k10Data.remainingUtrymme >= 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                        )}>
                                            {formatCurrency(k10Data.remainingUtrymme)}
                                        </span>
                                    </div>
                                </div>

                                {k10Data.remainingUtrymme < 0 && (
                                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                                    Gränsbeloppet överskridet
                                                </p>
                                                <p className="text-amber-700/80 dark:text-amber-300/80">
                                                    {formatCurrency(Math.abs(k10Data.remainingUtrymme))} av utdelningen
                                                    beskattas som inkomst av tjänst (32-52% skatt).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Card - Takes 1/3 width, styled as standing rectangle */}
                        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-0 h-fit">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium text-blue-900 dark:text-blue-100">
                                    Om K10 och 3:12-reglerna
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                    K10 används av delägare i fåmansföretag för att beräkna hur stor del av utdelningen
                                    som beskattas som kapitalinkomst (20%) respektive tjänsteinkomst (32-52%).
                                </p>
                                <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                    Gränsbeloppet avgör tröskeln. Sparat utrymme kan användas kommande år.
                                </p>
                                <div className="pt-2">
                                    <p className="text-xs text-blue-700/70 dark:text-blue-300/70">
                                        💡 Tips: Maximera ditt lönebaserade utrymme genom att ta ut rätt lön innan årets slut.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* K10 History with Table3 */}
                    <div className="pt-6 border-t-2 border-border/60">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">K10-historik</h3>
                            <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs bg-background border-border/60 hover:bg-muted/50">
                                <FileDown className="h-3 w-3 mr-1.5" />
                                Exportera SRU
                            </Button>
                        </div>

                        <GridTableHeader
                            columns={[
                                { label: "År", icon: Calendar, span: 2 },
                                { label: "Gränsbelopp", icon: TrendingUp, align: "right", span: 3 },
                                { label: "Utnyttjat", icon: Percent, align: "right", span: 3 },
                                { label: "Sparat", icon: Calculator, align: "right", span: 2 },
                                { label: "Status", align: "center", span: 2 },
                            ]}
                        />

                        <GridTableRows>
                            {displayedHistory.map((k10) => (
                                <GridTableRow key={k10.year}>
                                    <div style={{ gridColumn: 'span 2' }} className="font-medium text-sm">{k10.year}</div>
                                    <div style={{ gridColumn: 'span 3' }} className="text-right font-medium text-sm tabular-nums">
                                        {formatCurrency(k10.gransbelopp)}
                                    </div>
                                    <div style={{ gridColumn: 'span 3' }} className="text-right font-medium text-sm tabular-nums">
                                        {formatCurrency(k10.usedAmount)}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="text-right font-medium text-sm tabular-nums text-green-600 dark:text-green-400">
                                        +{formatCurrency(k10.savedAmount)}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="flex justify-center">
                                        <AppStatusBadge status={k10.status === "submitted" ? "Inskickad" : "Utkast"} />
                                    </div>
                                </GridTableRow>
                            ))}
                        </GridTableRows>

                        {k10Declarations.length > 5 && (
                            <div className="flex justify-center py-2 border-t border-border/40">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllHistory(!showAllHistory)}
                                    className="text-muted-foreground hover:text-foreground text-xs"
                                >
                                    {showAllHistory ? (
                                        <>
                                            Visa färre
                                            <ChevronUp className="ml-1.5 h-3 w-3" />
                                        </>
                                    ) : (
                                        <>
                                            Visa alla {k10Declarations.length} år
                                            <ChevronDown className="ml-1.5 h-3 w-3" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>


                </div>
            </main>
        </TooltipProvider >
    )
}
