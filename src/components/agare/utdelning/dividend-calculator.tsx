import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { type K10Data } from "@/components/rapporter/k10/use-k10-calculation"

interface DividendCalculatorProps {
    k10Data: K10Data
}

export function DividendCalculator({ k10Data }: DividendCalculatorProps) {
    const usesMainRule = k10Data.lonebaseratUtrymme > k10Data.schablonbelopp

    return (
        <Card className="p-4 border-2 border-dotted">
            <h2 className="font-medium mb-4">K10-underlag</h2>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-muted-foreground">Schablonbelopp</label>
                    <p className={`text-lg font-semibold ${!usesMainRule ? 'text-primary' : ''}`}>
                        {formatCurrency(k10Data.schablonbelopp)}
                        {!usesMainRule && <span className="text-xs ml-1">✓</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">2,75 × IBB × {k10Data.agarandel}% ägarandel</p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Lönebaserat utrymme</label>
                    <p className={`text-lg font-semibold ${usesMainRule ? 'text-primary' : ''}`}>
                        {formatCurrency(k10Data.lonebaseratUtrymme)}
                        {usesMainRule && <span className="text-xs ml-1">✓</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {k10Data.klararLonekrav
                            ? "50% av löneunderlag × ägarandel"
                            : "Lönekrav ej uppfyllt"
                        }
                    </p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                    <p className="text-lg font-semibold">{formatCurrency(k10Data.sparatUtdelningsutrymme)}</p>
                    <p className="text-xs text-muted-foreground">
                        {k10Data.sparatUtdelningsutrymme > 0 ? "Från tidigare K10" : "Ingen historik ännu"}
                    </p>
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
