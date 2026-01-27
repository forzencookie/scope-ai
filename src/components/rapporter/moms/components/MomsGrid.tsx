import { Calendar, Clock, ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2 } from "lucide-react"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { VatReport } from "@/services/processors/vat-processor"

interface MomsGridProps {
    periods: VatReport[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection: any
    onSelectReport: (report: VatReport) => void
}

export function MomsGrid({ periods, selection, onSelectReport }: MomsGridProps) {
    return (
        <div className="overflow-x-auto -mx-2 px-2">
            <GridTableHeader
                columns={[
                    { label: "Period", icon: Calendar, span: 2 },
                    { label: "Deadline", icon: Clock, span: 2, hiddenOnMobile: true },
                    { label: "Utgående moms", icon: ArrowUpRight, span: 2, align: "right", hiddenOnMobile: true },
                    { label: "Ingående moms", icon: ArrowDownRight, span: 2, align: "right", hiddenOnMobile: true },
                    { label: "Att betala", icon: Wallet, span: 2, align: "right" },
                    { label: "Status", icon: CheckCircle2, span: 1 },
                ]}
                trailing={
                    <Checkbox
                        checked={selection.allSelected && periods.length > 0}
                        onCheckedChange={selection.toggleAll}
                    />
                }
            />

            <GridTableRows>
                {periods.map((item) => (
                    <GridTableRow
                        key={item.period}
                        onClick={() => onSelectReport(item)}
                        selected={selection.isSelected(item.period)}
                    >
                        <div style={{ gridColumn: 'span 2' }} className="font-medium">
                            {item.period}
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground hidden md:block">
                            {item.dueDate}
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums hidden md:block">
                            {item.salesVat.toLocaleString("sv-SE")} kr
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums hidden md:block">
                            {item.inputVat.toLocaleString("sv-SE")} kr
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums font-medium">
                            {item.netVat.toLocaleString("sv-SE")} kr
                        </div>
                        <div style={{ gridColumn: 'span 1' }}>
                            <AppStatusBadge
                                status={item.status === "upcoming" ? "Kommande" : "Inskickad"}
                            />
                        </div>
                        <div
                            style={{ gridColumn: 'span 1' }}
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Checkbox
                                checked={selection.isSelected(item.period)}
                                onCheckedChange={() => selection.toggleItem(item.period)}
                            />
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
        </div>
    )
}
