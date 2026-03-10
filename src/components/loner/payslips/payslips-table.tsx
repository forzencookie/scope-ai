"use client"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow,
} from "@/components/ui/grid-table"
import type { Payslip } from "./use-payslips-logic"
import { Calendar, User, Wallet, Banknote, CheckCircle2, FileText, Plus } from "lucide-react"
import { ActionEmptyState } from "@/components/shared"
import { useHighlight } from "@/hooks"

interface PayslipsTableProps {
    data: Payslip[]
    selectedIds: Set<string>
    onToggleSelection: (id: string) => void
    onToggleAll: () => void
    onRowClick: (payslip: Payslip) => void
    onAddPayslip?: () => void
}

export function PayslipsTable({
    data,
    selectedIds,
    onToggleSelection,
    onToggleAll,
    onRowClick,
    onAddPayslip
}: PayslipsTableProps) {
    const allSelected = data.length > 0 && selectedIds.size === data.length

    const columns = [
        { label: "Anställd", icon: User, span: 3 },
        { label: "Period", icon: Calendar, span: 2, hiddenOnMobile: true },
        { label: "Brutto", icon: Banknote, span: 2, hiddenOnMobile: true },
        { label: "Netto", icon: Wallet, span: 2 },
        { label: "Status", icon: CheckCircle2, span: 2 },
    ]

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px] px-2">
                <GridTableHeader
                    columns={columns}
                    trailing={
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={onToggleAll}
                        />
                    }
                />
                <GridTableRows>
                    {data.map((slip) => (
                        <PayslipRow 
                            key={slip.id} 
                            slip={slip} 
                            selected={selectedIds.has(String(slip.id))} 
                            onRowClick={onRowClick} 
                            onToggleSelection={onToggleSelection} 
                        />
                    ))}
                    {data.length === 0 && (
                        <ActionEmptyState
                            icon={Banknote}
                            title="Inga lönebesked än"
                            description="Det är dags att förbereda månadens löner. Scooby kan hjälpa dig att räkna ut bruttolön och skatt för alla anställda."
                            actionLabel="Starta lönekörning"
                            actionPrompt="Jag vill göra en ny lönekörning för den här månaden"
                        />
                    )}
                </GridTableRows>
            </div>
        </div>
    )
}

function PayslipRow({ 
    slip, 
    selected, 
    onRowClick, 
    onToggleSelection 
}: { 
    slip: Payslip, 
    selected: boolean, 
    onRowClick: (p: Payslip) => void, 
    onToggleSelection: (id: string) => void 
}) {
    const { highlightClass } = useHighlight(String(slip.id))

    return (
        <GridTableRow
            onClick={() => onRowClick(slip)}
            selected={selected}
            className={highlightClass}
        >
            <div className="col-span-3 font-medium truncate flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {slip.employee.substring(0, 2).toUpperCase()}
                </div>
                <span className="truncate">{slip.employee}</span>
            </div>
            <div className="col-span-2 text-muted-foreground tabular-nums hidden md:block">
                {slip.period}
            </div>
            <div className="col-span-2 tabular-nums text-muted-foreground hidden md:block">
                {formatCurrency(slip.grossSalary)}
            </div>
            <div className="col-span-2 font-medium tabular-nums">
                {formatCurrency(slip.netSalary)}
            </div>
            <div className="col-span-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <AppStatusBadge status={slip.status as any} size="sm" />
            </div>
            <div
                className={cn(
                    "col-span-1 flex justify-end items-center transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleSelection(String(slip.id))}
                />
            </div>
        </GridTableRow>
    )
}
