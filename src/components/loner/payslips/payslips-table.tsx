// @ts-nocheck
"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils"
import {
    GridTableContainer,
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
        { label: "Brutto", icon: Banknote, span: 2, align: 'right' as const },
        { label: "Netto", icon: Wallet, span: 2, align: 'right' as const },
        { label: "Status", icon: CheckCircle2, span: 2 },
    ]

    return (
        <GridTableContainer>
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
                        <div className="w-[50px] p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                checked={selectedIds.has(String(slip.id))}
                                onCheckedChange={() => onToggleSelection(String(slip.id))}
                            />
                        </div>
                        <div className="flex-1 p-4 font-medium flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {slip.employee.substring(0, 2).toUpperCase()}
                            </div>
                            {slip.employee}
                        </div>
                        <div className="w-[120px] p-4 text-sm text-muted-foreground tabular-nums">
                            {slip.period}
                        </div>
                        <div className="w-[120px] p-4 text-right text-sm tabular-nums text-muted-foreground">
                            {formatCurrency(slip.grossSalary)}
                        </div>
                        <div className="w-[120px] p-4 text-right text-sm font-medium tabular-nums">
                            {formatCurrency(slip.netSalary)}
                        </div>
                        <div className="w-[140px] p-4">
                            <AppStatusBadge status={slip.status === 'draft' ? 'Utkast' : slip.status === 'paid' ? 'Betald' : 'Granskas'} />
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
        </GridTableContainer>
    )
}
