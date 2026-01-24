// @ts-nocheck
"use client"

import { User, Calendar, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmployeeBenefit, FormanCatalogItem } from "@/lib/ai/tool-types"

interface EmployeeListProps {
    benefit: FormanCatalogItem
    assignedEmployees: EmployeeBenefit[]
    onDelete?: (id: string) => void
}

export function EmployeeList({ benefit, assignedEmployees, onDelete }: EmployeeListProps) {
    const employeesWithBenefit = assignedEmployees.filter(
        e => e.benefitType === benefit.id
    )

    // Calculate remaining allowance for allowance-based benefits
    const getRemainingAllowance = (employeeName: string) => {
        if (!benefit.maxAmount) return null
        const used = assignedEmployees
            .filter(e => e.benefitType === benefit.id && e.employeeName === employeeName)
            .reduce((sum, e) => sum + e.amount, 0)
        return benefit.maxAmount - used
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Anställda med förmånen ({employeesWithBenefit.length})
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {employeesWithBenefit.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-md text-center">
                        Inga anställda har denna förmån än.
                    </div>
                ) : (
                    employeesWithBenefit.map((employee, i) => {
                        const remaining = getRemainingAllowance(employee.employeeName)
                        const metadata = employee.metadata || {}

                        return (
                            <div key={i} className="flex items-start justify-between p-3 bg-muted/40 rounded-lg border hover:bg-muted/60 transition-colors group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-medium">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {employee.employeeName}
                                    </div>
                                    <div className="text-sm text-muted-foreground pl-6">
                                        {formatCurrency(employee.amount)}
                                        {benefit.period && <span className="text-xs ml-1">/{benefit.period}</span>}
                                    </div>

                                    {/* Detailed Metadata Display */}
                                    <div className="pl-6 text-xs text-muted-foreground space-y-0.5 mt-1">
                                        {metadata.date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{String(metadata.date)}</span>
                                            </div>
                                        )}
                                        {metadata.regNumber && <span>Reg: {String(metadata.regNumber)}</span>}
                                        {metadata.distance && <span>Sträcka: {String(metadata.distance)} mil</span>}
                                        {metadata.days && <span>Dagar: {String(metadata.days)}</span>}
                                    </div>

                                    {/* Allowance visualizer */}
                                    {remaining !== null && (
                                        <div className="pl-6 pt-1">
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden max-w-[120px]">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${Math.min(100, (employee.amount / benefit.maxAmount!) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatCurrency(remaining)} kvar
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onDelete?.(employee.id || '')} // Assuming ID exists or we handle by index
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
