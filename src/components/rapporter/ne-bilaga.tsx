"use client"

import { useState, useMemo } from "react"
// import { useRouter } from "next/navigation"
import {
    Calendar,
    TrendingUp,
    Clock,
    Bot,
    Send,
    FileDown,
    Percent,
    Calculator,
    Info,
} from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
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
    CollapsibleTableContainer,
    CollapsibleTableSection,
    type CollapsibleTableItem
} from "@/components/ui/collapsible-table"
import { SectionCard } from "@/components/ui/section-card"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { useVerifications } from "@/hooks/use-verifications"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

// =============================================================================
// NE-bilaga Structure (Swedish Tax Form for Enskild Firma)
// =============================================================================

// NE form sections based on Skatteverket's NE-bilaga
// R1-R14: Income statement items
// R15-R24: Balance sheet adjustments
// R25-R45: Tax adjustments and final result


// Mock calculated data - in production this would come from verifications/ledger
function useNECalculation() {
    const { verifications: _ } = useVerifications()

    // Calculate from verifications (simplified - would use proper account mappings)
    return useMemo(() => {
        // Revenue section (R1-R5)
        const nettoomsattning = 850000  // From accounts 30xx-34xx
        const ovrigaIntakter = 12500    // From accounts 39xx
        const summaIntakter = nettoomsattning + ovrigaIntakter

        // Cost section (R6-R13)
        const varuinköp = -245000       // From accounts 40xx
        const ovrigaKostnader = -180000 // From accounts 50xx-69xx
        const personalKostnader = 0     // EF typically no employees
        const avskrivningar = -35000    // From accounts 78xx
        const summaKostnader = varuinköp + ovrigaKostnader + personalKostnader + avskrivningar

        // Result before egenavgifter (R14)
        const resultatForeEgenavgifter = summaIntakter + summaKostnader

        // Egenavgifter calculation
        const egenavgifterRate = 0.2897 // 28.97%
        const schablonavdrag = Math.round(resultatForeEgenavgifter * 0.25 * egenavgifterRate)

        // Periodiseringsfond (optional tax deferral)
        const periodiseringsfond = Math.round(resultatForeEgenavgifter * 0.30) // Max 30%
        const aterforing = 85000 // From previous years

        // Final taxable result
        const resultatEfterAvdrag = resultatForeEgenavgifter - schablonavdrag - periodiseringsfond + aterforing
        const egenavgifter = Math.round(resultatEfterAvdrag * egenavgifterRate)
        const slutligtResultat = resultatEfterAvdrag - egenavgifter

        return {
            // Revenue
            R1: nettoomsattning,
            R5: ovrigaIntakter,
            R6: summaIntakter,

            // Costs
            R7: varuinköp,
            R8: ovrigaKostnader,
            R10: avskrivningar,
            R11: summaKostnader,

            // Results
            R12: resultatForeEgenavgifter,
            R13: schablonavdrag,
            R14: -periodiseringsfond,
            R15: aterforing,
            R24: resultatEfterAvdrag,

            // Final
            egenavgifter,
            slutligtResultat,

            // Stats
            totals: {
                revenue: summaIntakter,
                costs: summaKostnader,
                result: resultatForeEgenavgifter,
                taxableResult: slutligtResultat,
            }
        }
    }, [])
}

// =============================================================================
// Main Component
// =============================================================================

export function NEBilagaContent() {
    // const router = useRouter()
    const navigateToAI = useNavigateToAIChat()
    const { addToast: toast } = useToast()
    const neData = useNECalculation()
    const [showAdjustments, setShowAdjustments] = useState(true)

    // Income statement items for Table2Section
    const revenueItems: CollapsibleTableItem[] = [
        { label: "R1. Nettoomsättning", value: neData.R1 },
        { label: "R5. Övriga rörelseintäkter", value: neData.R5 },
    ]

    const costItems: CollapsibleTableItem[] = [
        { label: "R7. Varuinköp", value: neData.R7 },
        { label: "R8. Övriga externa kostnader", value: neData.R8 },
        { label: "R10. Avskrivningar", value: neData.R10 },
    ]

    const adjustmentItems: CollapsibleTableItem[] = [
        { label: "R13. Schablonavdrag för egenavgifter (25%)", value: -neData.R13 },
        { label: "R14. Avsättning till periodiseringsfond", value: neData.R14 },
        { label: "R15. Återföring periodiseringsfond", value: neData.R15 },
    ]

    const handleSend = () => {
        toast({
            title: "Kommer snart",
            description: "Integration med Skatteverket är under utveckling.",
        })
    }

    const handleExport = async () => {
        toast({
            title: "Exporterar NE-bilaga",
            description: "Förbereder PDF...",
        })
        try {
            await downloadElementAsPDF({
                fileName: `NE-bilaga-2024`,
                elementId: 'ne-bilaga-content'
            })
            toast({
                title: "Klart",
                description: "NE-bilaga har laddats ner som PDF.",
            })
        } catch {
            toast({
                title: "Fel",
                description: "Kunde inte skapa PDF. Försök igen.",
            })
        }
    }

    return (
        <TooltipProvider>
            <main className="flex-1 flex flex-col p-4 md:p-6">
                <div id="ne-bilaga-content" className="w-full space-y-4 md:space-y-6 bg-background">
                    {/* Page Heading */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">NE-bilaga</h2>
                            <p className="text-muted-foreground">Näringsverksamhet – Enskild firma. Bifogas till din personliga inkomstdeklaration.</p>
                        </div>
                    </div>

                    <StatCardGrid columns={4}>
                        <StatCard
                            label="Beskattningsår"
                            value="2024"
                            subtitle="NE-bilaga"
                            headerIcon={Calendar}
                        />
                        <StatCard
                            label="Resultat före egenavgifter"
                            value={formatCurrency(neData.R12)}
                            subtitle="R12"
                            headerIcon={TrendingUp}
                        />
                        <StatCard
                            label="Beräknade egenavgifter"
                            value={formatCurrency(neData.egenavgifter)}
                            subtitle="28,97%"
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

                    {/* AI Assistant Card */}
                    <SectionCard
                        icon={Bot}
                        title="AI-hjälp för NE-bilaga"
                        description="Få hjälp att fylla i NE-bilagan baserat på din bokföring."
                        variant="ai"
                        onAction={() => navigateToAI(getDefaultAIContext('ne-bilaga'))}
                        actionLabel="Starta AI-guiden"
                    />

                    {/* NE Form Sections */}
                    <CollapsibleTableContainer>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Resultaträkning (R1-R12)</h3>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>Dessa rader hämtas automatiskt från din bokföring. Kontrollera att beloppen stämmer.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <CollapsibleTableSection
                            title="Rörelseintäkter"
                            items={revenueItems}
                            total={neData.R6}
                        />

                        <CollapsibleTableSection
                            title="Rörelsekostnader"
                            items={costItems}
                            total={neData.R11}
                        />

                        {/* Result before egenavgifter */}
                        <div className="border-t-2 border-primary/20 pt-4 mt-4 bg-muted/20 -mx-2 px-4 py-3 rounded-lg">
                            <div className="flex justify-between items-center font-semibold">
                                <span>R12. Resultat före egenavgifter</span>
                                <span className={cn(
                                    "tabular-nums",
                                    neData.R12 >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {formatCurrency(neData.R12)}
                                </span>
                            </div>
                        </div>
                    </CollapsibleTableContainer>

                    {/* Tax Adjustments Section */}
                    <CollapsibleTableContainer>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Skattemässiga justeringar (R13-R24)</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdjustments(!showAdjustments)}
                            >
                                {showAdjustments ? "Dölj" : "Visa"}
                            </Button>
                        </div>

                        {showAdjustments && (
                            <>
                                <CollapsibleTableSection
                                    title="Avdrag och avsättningar"
                                    items={adjustmentItems}
                                    hideTotalHeader
                                />

                                {/* Taxable result */}
                                <div className="border-t-2 border-primary/20 pt-4 mt-4 bg-muted/20 -mx-2 px-4 py-3 rounded-lg">
                                    <div className="flex justify-between items-center font-semibold">
                                        <span>R24. Överskott av näringsverksamhet</span>
                                        <span className={cn(
                                            "tabular-nums",
                                            neData.R24 >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                        )}>
                                            {formatCurrency(neData.R24)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Detta belopp förs till din personliga inkomstdeklaration (INK1).
                                    </p>
                                </div>
                            </>
                        )}
                    </CollapsibleTableContainer>

                    {/* Egenavgifter Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Beräknade egenavgifter
                            </CardTitle>
                            <CardDescription>
                                Baserat på ditt överskott beräknas egenavgifterna till följande.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Överskott (R24)</span>
                                    <span className="font-medium tabular-nums">{formatCurrency(neData.R24)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Egenavgifter (28,97%)</span>
                                    <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                                        -{formatCurrency(neData.egenavgifter)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="font-semibold">Netto efter egenavgifter</span>
                                    <span className="font-bold tabular-nums text-green-600 dark:text-green-400">
                                        {formatCurrency(neData.slutligtResultat)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                <p>
                                    <strong>Tips:</strong> Du kan minska ditt överskott genom avsättning till periodiseringsfond (max 30%)
                                    eller pensionssparande. Besök <em>Egenavgifter-kalkylatorn</em> för detaljerad beräkning.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Ladda ner PDF
                        </Button>
                        <Button onClick={handleSend}>
                            <Send className="h-4 w-4 mr-2" />
                            Skicka till Skatteverket
                        </Button>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Om NE-bilaga
                        </h4>
                        <p className="text-sm text-blue-800/80 dark:text-blue-200/80">
                            NE-bilagan är en del av din personliga inkomstdeklaration (INK1).
                            Resultatet från din enskilda firma beskattas som inkomst av näringsverksamhet
                            och läggs ihop med eventuella andra inkomster. Deadline är normalt 2 maj varje år.
                        </p>
                    </div>
                </div>
            </main>
        </TooltipProvider>
    )
}
