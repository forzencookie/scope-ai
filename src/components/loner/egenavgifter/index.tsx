"use client"

import { useState } from "react"
import { BookOpen, FileText, Calendar, Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useVerifications } from "@/hooks/use-verifications"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"
import { TaxSettingsCard } from "./tax-settings-card"
import { CalculationResult } from "./calculation-result"
import { MonthlyTrend } from "./monthly-trend"
import { useTaxCalculator } from "./use-tax-calculator"
import { PageHeader } from "@/components/shared"

export function EgenavgifterCalculator() {
    const toast = useToast()
    const { addVerification } = useVerifications()
    const [isBooking, setIsBooking] = useState(false)

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

    const handleBookEgenavgifter = async () => {
        if (isBooking) return
        setIsBooking(true)

        try {
            const monthlyAmount = Math.round(calculation.avgifter / 12)
            const today = new Date().toISOString().split('T')[0]
            const currentMonth = new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })

            await addVerification({
                date: today,
                description: `Egenavgifter ${currentMonth}`,
                sourceType: 'egenavgifter',
                rows: [
                    { account: "2510", description: `Skatteskuld egenavgifter ${currentMonth}`, debit: 0, credit: monthlyAmount },
                    { account: "6310", description: `Egenavgifter ${currentMonth}`, debit: monthlyAmount, credit: 0 },
                ]
            })

            toast.success("Egenavgifter bokförda", `${monthlyAmount.toLocaleString('sv-SE')} kr bokfört i verifikationer.`)
        } catch {
            toast.error("Kunde inte bokföra", "Ett fel uppstod vid bokföring av egenavgifter.")
        } finally {
            setIsBooking(false)
        }
    }

    return (
        <div className="space-y-6">
             <PageHeader
                 title="Egenavgifter"
                 subtitle="Beräkna egenavgifter och sociala avgifter för enskild firma."
                 actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                            toast.info("Laddar ner", "Förbereder PDF...")
                            try {
                                await downloadElementAsPDF({ fileName: `egenavgifter-${new Date().getFullYear()}`, elementId: 'egenavgifter-content' })
                                toast.success("Klart", "PDF har laddats ner.")
                            } catch {
                                toast.error("Fel", "Kunde inte skapa PDF.")
                            }
                        }}>
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                        <Button onClick={handleBookEgenavgifter} disabled={isBooking || calculation.avgifter <= 0}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            {isBooking ? "Bokför..." : "Bokför egenavgifter"}
                        </Button>
                    </div>
                 }
             />

             <div id="egenavgifter-content" className="space-y-6">
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

             {/* Government Info & Payment Schedule */}
             <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Inbetalningsschema</h4>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1.5">
                        <p>Egenavgifter betalas via preliminär F-skatt, som normalt delas upp i <strong>månadsvis eller kvartalsvis</strong> inbetalning till Skatteverket.</p>
                        <p>Betalningsdatum: <strong>12:e varje månad</strong> (eller närmaste bankdag).</p>
                        <p>Slutavräkning sker i samband med slutskattebeskedet.</p>
                    </div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Blanketter & dokument</h4>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1.5">
                        <p><strong>SKV 4314</strong> — Preliminär inkomstdeklaration (justering av F-skatt)</p>
                        <p><strong>NE-bilaga</strong> — Bilaga till inkomstdeklaration för enskild firma</p>
                        <p><strong>Skattekonto</strong> — Kontrollera inbetalningar och saldo på skatteverket.se</p>
                    </div>
                    <div className="flex items-start gap-2 pt-1 text-xs text-amber-600 dark:text-amber-400">
                        <Info className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>Verifikation skapas automatiskt när du bokför egenavgifter ovan.</span>
                    </div>
                </div>
             </div>
        </div>
    )
}
