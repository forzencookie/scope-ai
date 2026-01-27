"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow,
} from "@/components/ui/grid-table"
import type { Payslip } from "./use-payslips-logic"
import { Calendar, User, Wallet, Banknote, CheckCircle2 } from "lucide-react"

interface PayslipsTableProps {
    data: Payslip[]
    selectedIds: Set<string>
    onToggleSelection: (id: string) => void
    onToggleAll: () => void
    onRowClick: (payslip: Payslip) => void
}

export function PayslipsTable({ 
    data, 
    selectedIds, 
    onToggleSelection, 
    onToggleAll, 
    onRowClick 
}: PayslipsTableProps) {
    const allSelected = data.length > 0 && selectedIds.size === data.length

    const columns = [
        { label: "Anställd", icon: User, span: 3 },
        { label: "Period", icon: Calendar, span: 2 },
        { label: "Brutto", icon: Banknote, span: 2, align: 'right' as const, hiddenOnMobile: true },
        { label: "Netto", icon: Wallet, span: 2, align: 'right' as const },
        { label: "Status", icon: CheckCircle2, span: 2 },
    ]

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px]">
                <GridTableHeader
                    columns={columns}
                    gridCols={12}
                    trailing={
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={onToggleAll}
                        />
                    }
                />
                <GridTableRows>
                {data.map((slip) => (
                    <GridTableRow
                        key={slip.id}
                        onClick={() => onRowClick(slip)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        selected={selectedIds.has(String(slip.id))}
                    >
                        <div style={{ gridColumn: 'span 1' }} className="flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={selectedIds.has(String(slip.id))}
                                onCheckedChange={() => onToggleSelection(String(slip.id))}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 3' }} className="p-4 font-medium flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {slip.employee.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate">{slip.employee}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="p-4 text-sm text-muted-foreground tabular-nums">
                            {slip.period}
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="p-4 text-right text-sm tabular-nums text-muted-foreground hidden md:block">
                            {formatCurrency(slip.grossSalary)}
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="p-4 text-right text-sm font-medium tabular-nums">
                            {formatCurrency(slip.netSalary)}
                        </div>
                        <div style={{ gridColumn: 'span 2' }} className="p-4 flex items-center font-medium">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <AppStatusBadge status={slip.status as any} />
                        </div>
                    </GridTableRow>
                ))}
                </GridTableRows>
            </div>
        </div>
    )
}
