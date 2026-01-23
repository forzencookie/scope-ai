import { Bot } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface DividendCalculatorProps {
    salaryBasis: number
}

export function DividendCalculator({ salaryBasis }: DividendCalculatorProps) {
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium">Utdelningskalkylator</h2>
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-600" />
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-muted-foreground">Löneunderlag</label>
                    <p className="text-lg font-semibold">{formatCurrency(salaryBasis)}</p>
                    <p className="text-xs text-muted-foreground">Baserat på bokförda löner (70-72)</p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                    <p className="text-lg font-semibold">45 000 kr</p>
                    <p className="text-xs text-muted-foreground">Från tidigare år</p>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Totalt gränsbelopp</label>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-500/70">240 250 kr</p>
                    <p className="text-xs text-muted-foreground">Schablonbelopp + sparat</p>
                </div>
            </div>
        </Card>
    )
}
