"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { formatCurrency } from "@/lib/utils"
import {
  Calculator,
  Calendar,
  Percent,
  TrendingUp,
  Info,
  Sparkles,
  Download,
  ChevronRight,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DataTable,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/ui/data-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { calculateEgenavgifter, type EgenavgifterCalculation } from "@/data/ownership"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"

// 2024 rates (these should be kept updated)
const TAX_RATES = {
  egenavgifter: {
    sjukforsakring: 0.0388,
    foraldraforsakring: 0.0260,
    alderspension: 0.1021,
    efterlevandepension: 0.0070,
    arbetsmarknadsavgift: 0.0264,
    arbetsskadeavgift: 0.0020,
    allmänLöneAvgift: 0.1150,
  },
  fullRate: 0.2897, // Sum of above
  reducedRate: 0.10, // Under 26 or over 65
  karensReduction: 0.0076, // Optional reduction for longer waiting period
}

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  profit: number
  egenavgifter: number
}

export function EgenavgifterCalculator() {
  const [annualProfit, setAnnualProfit] = useState<number>(500000)
  const [isReduced, setIsReduced] = useState(false)
  const [includeKarensReduction, setIncludeKarensReduction] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Calculate egenavgifter using the function from ownership.ts
  const result: EgenavgifterCalculation = useMemo(() => {
    return calculateEgenavgifter(annualProfit)
  }, [annualProfit])

  // Calculate with current settings
  const calculation = useMemo(() => {
    let rate = isReduced ? TAX_RATES.reducedRate : TAX_RATES.fullRate
    if (includeKarensReduction && !isReduced) {
      rate -= TAX_RATES.karensReduction
    }

    const avgifter = Math.round(annualProfit * rate)
    const nettoEfterAvgifter = annualProfit - avgifter
    const monthlyNet = Math.round(nettoEfterAvgifter / 12)

    // Calculate individual components (full rate only)
    const components = !isReduced ? Object.entries(TAX_RATES.egenavgifter).map(([key, pct]) => ({
      name: formatComponentName(key),
      rate: pct,
      amount: Math.round(annualProfit * pct),
    })) : []

    return {
      rate,
      avgifter,
      nettoEfterAvgifter,
      monthlyNet,
      components,
    }
  }, [annualProfit, isReduced, includeKarensReduction])

  // Monthly trend data (mock)
  const monthlyData: MonthlyData[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    const monthlyProfit = annualProfit / 12
    
    return months.map((month, i) => {
      // Add some variation
      const variation = 0.8 + Math.random() * 0.4
      const profit = Math.round(monthlyProfit * variation)
      return {
        month,
        revenue: Math.round(profit * 1.5),
        expenses: Math.round(profit * 0.5),
        profit,
        egenavgifter: Math.round(profit * calculation.rate),
      }
    })
  }, [annualProfit, calculation.rate])

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Overview */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Beräknad vinst"
            value={formatCurrency(annualProfit)}
            subtitle="Förväntat resultat 2024"
            icon={TrendingUp}
          />
          <StatCard
            label="Egenavgifter"
            value={formatCurrency(calculation.avgifter)}
            subtitle={formatPercent(calculation.rate)}
            icon={Calculator}
          />
          <StatCard
            label="Netto efter avgifter"
            value={formatCurrency(calculation.nettoEfterAvgifter)}
            icon={Percent}
          />
          <StatCard
            label="Månadsvis netto"
            value={formatCurrency(calculation.monthlyNet)}
            subtitle="genomsnitt"
            icon={Calendar}
          />
        </StatCardGrid>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Beräkna egenavgifter
              </CardTitle>
              <CardDescription>
                Ange din förväntade vinst för att beräkna egenavgifterna
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profit">Beräknad årlig vinst (kr)</Label>
                <Input
                  id="profit"
                  type="number"
                  value={annualProfit}
                  onChange={(e) => setAnnualProfit(Number(e.target.value))}
                  className="text-lg tabular-nums"
                />
                <p className="text-xs text-muted-foreground">
                  Vinst = Intäkter - Kostnader (före egenavgifter)
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reducerad avgift</Label>
                    <p className="text-xs text-muted-foreground">
                      Under 26 år eller över 65 år
                    </p>
                  </div>
                  <Checkbox
                    checked={isReduced}
                    onCheckedChange={(checked) => setIsReduced(checked === true)}
                  />
                </div>

                {!isReduced && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-1">
                        Längre karenstid
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Om du väljer längre karenstid (7 dagar istället för 1) 
                              får du 0,76% lägre egenavgifter.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        -0,76% på avgiften
                      </p>
                    </div>
                    <Checkbox
                      checked={includeKarensReduction}
                      onCheckedChange={(checked) => setIncludeKarensReduction(checked === true)}
                    />
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avgiftssats</span>
                  <span className="font-medium">{formatPercent(calculation.rate)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Egenavgifter</span>
                  <span className="font-bold">{formatCurrency(calculation.avgifter)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 dark:text-green-500/70">
                  <span className="font-medium">Kvar efter avgifter</span>
                  <span className="font-bold">{formatCurrency(calculation.nettoEfterAvgifter)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <ChevronRight className={cn("h-4 w-4 mr-2 transition-transform", showBreakdown && "rotate-90")} />
                {showBreakdown ? 'Dölj' : 'Visa'} uppdelning
              </Button>

              {showBreakdown && !isReduced && (
                <div className="space-y-2 text-sm">
                  {calculation.components.map((comp) => (
                    <div key={comp.name} className="flex justify-between items-center py-1.5 border-b border-dashed">
                      <span className="text-muted-foreground">{comp.name}</span>
                      <div className="text-right">
                        <span className="tabular-nums">{formatCurrency(comp.amount)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatPercent(comp.rate)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI-insikter
              </CardTitle>
              <CardDescription>
                Rekommendationer baserat på din ekonomi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-purple-50/50 dark:bg-purple-950/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Preliminärskatt
                </h4>
                <p className="text-sm text-muted-foreground">
                  Baserat på din beräknade vinst på {formatCurrency(annualProfit)}, 
                  bör din preliminärskatt ligga på cirka {formatCurrency(Math.round(annualProfit * 0.30))} 
                  per år (exkl. egenavgifter). Överväg att sätta av {formatCurrency(Math.round(annualProfit * 0.59 / 12))} 
                  per månad för skatt + avgifter.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Optimeringstips</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Med längre karenstid sparar du {formatCurrency(Math.round(annualProfit * 0.0076))} per år
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Överväg pensionssparande - avdragsgill kostnad som minskar underlaget
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Se över om aktiebolag är mer förmånligt vid din vinstnivå
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Kommande deadlines</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between">
                    <span>Preliminärskatt Q2</span>
                    <span className="text-muted-foreground">12 juni 2024</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Momsdeklaration</span>
                    <span className="text-muted-foreground">26 maj 2024</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>NE-bilaga deadline</span>
                    <span className="text-muted-foreground">2 maj 2024</span>
                  </li>
                </ul>
              </div>

              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportera beräkning
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <DataTable title="Månadsvis översikt">
          <DataTableHeader>
            <DataTableHeaderCell label="Månad" icon={Calendar} />
            <DataTableHeaderCell label="Vinst" icon={Banknote} align="right" />
            <DataTableHeaderCell label="Egenavgifter" icon={Percent} align="right" />
            <DataTableHeaderCell label="Netto" icon={TrendingUp} align="right" />
          </DataTableHeader>
          <DataTableBody>
            {monthlyData.map((m) => (
              <DataTableRow key={m.month}>
                <DataTableCell bold>{m.month}</DataTableCell>
                <DataTableCell align="right" mono>{formatCurrency(m.profit)}</DataTableCell>
                <DataTableCell align="right" mono className="text-red-600 dark:text-red-500/70">-{formatCurrency(m.egenavgifter)}</DataTableCell>
                <DataTableCell align="right" mono className="text-green-600 dark:text-green-500/70">{formatCurrency(m.profit - m.egenavgifter)}</DataTableCell>
              </DataTableRow>
            ))}
            {/* Total row */}
            <DataTableRow className="font-medium bg-muted/30">
              <DataTableCell bold>Totalt</DataTableCell>
              <DataTableCell align="right" mono>{formatCurrency(annualProfit)}</DataTableCell>
              <DataTableCell align="right" mono className="text-red-600 dark:text-red-500/70">-{formatCurrency(calculation.avgifter)}</DataTableCell>
              <DataTableCell align="right" mono className="text-green-600 dark:text-green-500/70">{formatCurrency(calculation.nettoEfterAvgifter)}</DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      </div>
    </TooltipProvider>
  )
}

// Helper to format component names
function formatComponentName(key: string): string {
  const names: Record<string, string> = {
    sjukforsakring: 'Sjukförsäkringsavgift',
    foraldraforsakring: 'Föräldraförsäkringsavgift',
    alderspension: 'Ålderspensionsavgift',
    efterlevandepension: 'Efterlevandepensionsavgift',
    arbetsmarknadsavgift: 'Arbetsmarknadsavgift',
    arbetsskadeavgift: 'Arbetsskadeavgift',
    allmänLöneAvgift: 'Allmän löneavgift',
  }
  return names[key] || key
}
