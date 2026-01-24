import { Percent, Banknote, Wallet, Sparkles } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface CalculationResultProps {
    calculation: {
        rate: number
        avgifter: number
        nettoEfterAvgifter: number
        monthlyNet: number
        components: Array<{ name: string, rate: number, amount: number }>
    }
}

export function CalculationResult({ calculation }: CalculationResultProps) {
    return (
        <div className="space-y-6">
            <StatCardGrid>
                <StatCard
                    label="Totala egenavgifter"
                    value={formatCurrency(calculation.avgifter)}
                    headerIcon={Percent}
                    subtitle={`${(calculation.rate * 100).toFixed(2)}% av vinsten`}
                />
                <StatCard
                    label="Kvar efter avgifter"
                    value={formatCurrency(calculation.nettoEfterAvgifter)}
                    headerIcon={Wallet}
                    subtitle="Före inkomstskatt"
                />
                <StatCard
                    label="Månadslön (brutto)"
                    value={formatCurrency(calculation.monthlyNet)}
                    headerIcon={Banknote}
                    subtitle="Motsvarande bruttolön"
                />
            </StatCardGrid>

            {/* Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Avgiftsspecifikation</CardTitle>
                    <CardDescription>
                        Så här fördelas dina sociala avgifter
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {calculation.components.length > 0 ? (
                        <div className="space-y-3">
                            {calculation.components.map((comp) => (
                                <div key={comp.name} className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
                                    <span className="text-muted-foreground">{comp.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-muted-foreground w-16 text-right">
                                            {(comp.rate * 100).toFixed(2)}%
                                        </span>
                                        <span className="font-medium font-mono min-w-[100px] text-right">
                                            {formatCurrency(comp.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-2 flex items-center justify-between font-bold">
                                <span>Totalt</span>
                                <span className="font-mono">{formatCurrency(calculation.avgifter)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                            <p>Du har reducerad avgift ({(calculation.rate * 100).toFixed(2)}%).</p>
                            <p className="text-sm">Endast ålderspensionsavgift betalas.</p>
                        </div>
                    )}
                    
                    <div className="pt-4 bg-muted/30 -mx-6 -mb-6 p-6 mt-4 border-t">
                         <div className="flex items-start gap-3">
                            <Percent className="h-5 w-5 text-primary mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-medium">Schablonvsavdrag</h4>
                                <p className="text-sm text-muted-foreground">
                                    Du får göra ett schablonavdrag på 25% för egenavgifter i deklarationen.
                                    Det slutliga beloppet stäms av i slutskattebeskedet.
                                </p>
                            </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
