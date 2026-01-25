import { useState } from "react"
import { Calendar, TrendingUp, Percent, Calculator, FileDown, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils"
import { k10Declarations } from "@/components/loner/constants"

interface K10HistoryProps {
    onExport: () => void
}

export function K10History({ onExport }: K10HistoryProps) {
    const [showAllHistory, setShowAllHistory] = useState(false)
    const displayedHistory = showAllHistory ? k10Declarations : k10Declarations.slice(0, 5)

    return (
        <div className="pt-6 border-t-2 border-border/60">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">K10-historik</h3>
                <Button variant="outline" size="sm" onClick={onExport} className="h-7 text-xs bg-background border-border/60 hover:bg-muted/50">
                    <FileDown className="h-3 w-3 mr-1.5" />
                    Exportera SRU
                </Button>
            </div>

            <div className="w-full overflow-x-auto pb-4 -mx-2">
                <div className="min-w-[800px] px-2">
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
                </div>
            </div>

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
    )
}
