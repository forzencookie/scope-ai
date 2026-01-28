import { Calendar, TrendingUp, Percent, Calculator, FileDown, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GridTableHeader, GridTableRows } from "@/components/ui/grid-table"

interface K10HistoryProps {
    onExport: () => void
}

export function K10History({ onExport }: K10HistoryProps) {
    // TODO: In full implementation, this would fetch from k10declarations database table
    // For now, show empty state as there's no historical data for new users
    const hasHistory = false

    return (
        <div className="pt-6 border-t-2 border-border/60">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">K10-historik</h3>
                <Button variant="outline" size="sm" onClick={onExport} className="h-7 text-xs bg-background border-border/60 hover:bg-muted/50">
                    <FileDown className="h-3 w-3 mr-1.5" />
                    Exportera SRU
                </Button>
            </div>

            {hasHistory ? (
                <div className="w-full overflow-x-auto pb-4 -mx-2">
                    <div className="md:min-w-[800px] px-2">
                        <GridTableHeader
                            columns={[
                                { label: "År", icon: Calendar, span: 2 },
                                { label: "Gränsbelopp", icon: TrendingUp, align: "right", span: 3, hiddenOnMobile: true },
                                { label: "Utnyttjat", icon: Percent, align: "right", span: 3, hiddenOnMobile: true },
                                { label: "Sparat", icon: Calculator, align: "right", span: 2 },
                                { label: "Status", align: "center", span: 2 },
                            ]}
                        />
                        <GridTableRows>
                            {/* Rows would be rendered here when data exists */}
                            <div />
                        </GridTableRows>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Ingen K10-historik än.</p>
                    <p className="text-xs mt-1">Dina K10-deklarationer kommer visas här efter inlämning.</p>
                </div>
            )}
        </div>
    )
}
