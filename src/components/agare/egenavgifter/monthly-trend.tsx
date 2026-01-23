import { Calendar, Banknote, Percent, TrendingUp } from "lucide-react"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { formatCurrency } from "@/lib/utils"
import { MonthlyData } from "./use-tax-calculator"

interface MonthlyTrendProps {
    monthlyData: MonthlyData[]
    calculation: {
        avgifter: number
        nettoEfterAvgifter: number
    }
    annualProfit: number
}

export function MonthlyTrend({ monthlyData, calculation, annualProfit }: MonthlyTrendProps) {
    return (
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-lg">Månadsvis översikt</h3>
          <GridTableHeader
            columns={[
              { label: "Månad", icon: Calendar, span: 3 },
              { label: "Vinst", icon: Banknote, span: 3, align: 'right' },
              { label: "Egenavgifter", icon: Percent, span: 3, align: 'right' },
              { label: "Netto", icon: TrendingUp, span: 3, align: 'right' },
            ]}
          />
          <GridTableRows>
            {monthlyData.map((m) => (
              <GridTableRow key={m.month}>
                <div className="col-span-3 font-semibold">{m.month}</div>
                <div className="col-span-3 text-right font-mono">{formatCurrency(m.profit)}</div>
                <div className="col-span-3 text-right font-mono text-red-600 dark:text-red-500/70">-{formatCurrency(m.egenavgifter)}</div>
                <div className="col-span-3 text-right font-mono text-green-600 dark:text-green-500/70">{formatCurrency(m.profit - m.egenavgifter)}</div>
              </GridTableRow>
            ))}
            {/* Total row */}
            <div className="grid grid-cols-12 px-4 py-3 bg-muted/30 font-medium border-t border-border/60">
              <div className="col-span-3 font-bold">Totalt</div>
              <div className="col-span-3 text-right font-mono">{formatCurrency(annualProfit)}</div>
              <div className="col-span-3 text-right font-mono text-red-600 dark:text-red-500/70">-{formatCurrency(calculation.avgifter)}</div>
              <div className="col-span-3 text-right font-mono text-green-600 dark:text-green-500/70">{formatCurrency(calculation.nettoEfterAvgifter)}</div>
            </div>
          </GridTableRows>
        </div>
    )
}
