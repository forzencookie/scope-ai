import { Bot } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { type K10Data } from "@/components/rapporter/k10/use-k10-calculation"

interface DividendCalculatorProps {
    k10Data: K10Data
}

export function DividendCalculator({ k10Data }: DividendCalculatorProps) {
    return (
        <Card className="p-4 border-dashed">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">Utdelningskalkylator</h2>
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-600" />
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-muted-foreground">Schablonbelopp</label>
                    <p className="text-lg font-semibold">{formatCurrency(k10Data.schablonbelopp)}</p>
                    <p className="text-xs text-muted-foreground">2,75 × IBB × {k10Data.agarandel}% ägarandel</p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Lönebaserat utrymme</label>
                    <p className="text-lg font-semibold">{formatCurrency(k10Data.lonebaseratUtrymme)}</p>
                    <p className="text-xs text-muted-foreground">
                        {k10Data.klararLonekrav
                            ? "50% av löneunderlag × ägarandel"
                            : "Lönekrav ej uppfyllt — schablonmetoden används"
                        }
                    </p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                    <p className="text-lg font-semibold">0 kr</p>
                    <p className="text-xs text-muted-foreground">Ingen historik ännu</p>
                </div>
                <div className="pt-3 border-t">
                    <label className="text-sm text-muted-foreground">Totalt gränsbelopp</label>
                    <p className="text-lg font-bold text-green-600 dark:text-green-500/70">{formatCurrency(k10Data.gransbelopp)}</p>
                    <p className="text-xs text-muted-foreground">Max utdelning till 20% skatt</p>
                </div>
            </div>
        </Card>
    )
}
