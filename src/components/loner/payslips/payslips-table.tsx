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

    return (
        <GridTableContainer>
            <GridTableHeader>
                <div className="w-[50px] p-4 flex items-center justify-center">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={onToggleAll}
                    />
                </div>
                <div className="flex-1 p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Anställd
                </div>
                <div className="w-[120px] p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Period
                </div>
                <div className="w-[120px] p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-2">
                    <Banknote className="h-4 w-4" /> Brutto
                </div>
                <div className="w-[120px] p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-2">
                    <Wallet className="h-4 w-4" /> Netto
                </div>
                <div className="w-[140px] p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Status
                </div>
            </GridTableHeader>
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
                            <AppStatusBadge status={slip.status === 'draft' ? 'utkast' : slip.status === 'paid' ? 'utbetald' : 'granskas'} />
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
        </GridTableContainer>
    )
}
