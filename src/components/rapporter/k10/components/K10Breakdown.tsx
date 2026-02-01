"use client"

import { useState } from "react"
import { Calculator, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { K10Data } from "../use-k10-calculation"

interface K10BreakdownProps {
    data: K10Data
}

export function K10Breakdown({ data }: K10BreakdownProps) {
    const [showBreakdown, setShowBreakdown] = useState(false)

    return (
        <div>
            <div>
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
                                <span className="text-muted-foreground">2,75 × IBB × ägarandel</span>
                                <span className="font-medium tabular-nums">{formatCurrency(data.schablonbelopp)}</span>
                            </div>

                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
                                Lönebaserat utrymme
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">50% av lönesumma × ägarandel</span>
                                <span className="font-medium tabular-nums">{formatCurrency(data.lonebaseratUtrymme)}</span>
                            </div>
                            {!data.klararLonekrav && (
                                <p className="text-xs text-amber-600 italic">
                                    * Löneuttagskravet ej uppfyllt. Minst {formatCurrency(0)} (beroende på IBB) krävs.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/60">
                            <span className="font-medium">Totalt gränsbelopp</span>
                            <span className="font-bold tabular-nums text-lg">{formatCurrency(data.gransbelopp)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/60">
                            <span className="text-muted-foreground">Utnyttjat i utdelning</span>
                            <span className="font-bold tabular-nums text-lg text-red-600 dark:text-red-400">
                                -{formatCurrency(data.totalDividends)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-semibold">Kvar att använda</span>
                            <span className={cn(
                                "font-bold tabular-nums text-lg",
                                data.remainingUtrymme >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            )}>
                                {formatCurrency(data.remainingUtrymme)}
                            </span>
                        </div>
                    </div>

                    {data.remainingUtrymme < 0 && (
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 dark:text-amber-200">
                                        Gränsbeloppet överskridet
                                    </p>
                                    <p className="text-amber-700/80 dark:text-amber-300/80">
                                        {formatCurrency(Math.abs(data.remainingUtrymme))} av utdelningen
                                        beskattas som inkomst av tjänst (32-52% skatt).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
