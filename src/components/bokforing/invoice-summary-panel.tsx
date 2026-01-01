"use client"

import * as React from "react"
import { Plus, FileText, Clock, AlertTriangle, TrendingUp, Filter } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTextMode } from "@/providers/text-mode-provider"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import type { Invoice } from "@/data/invoices"

// ============================================================================
// Invoice Summary Panel - Left Column of Dashboard
// ============================================================================

interface InvoiceSummaryPanelProps {
    invoices: Invoice[]
    onCreateNew: () => void
    onFilterByStatus?: (status: string | null) => void
    activeFilter?: string | null
}

export function InvoiceSummaryPanel({
    invoices,
    onCreateNew,
    onFilterByStatus,
    activeFilter,
}: InvoiceSummaryPanelProps) {
    const { text } = useTextMode()

    // Calculate stats
    const stats = React.useMemo(() => {
        const outstanding = invoices.filter(inv =>
            inv.status !== INVOICE_STATUS_LABELS.PAID && inv.status !== INVOICE_STATUS_LABELS.CANCELLED
        )
        const overdue = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.OVERDUE)
        const paid = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.PAID)
        const draft = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.DRAFT)
        const sent = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.SENT)

        return {
            total: invoices.length,
            outstandingAmount: outstanding.reduce((sum, inv) => sum + inv.amount, 0),
            outstandingCount: outstanding.length,
            overdueAmount: overdue.reduce((sum, inv) => sum + inv.amount, 0),
            overdueCount: overdue.length,
            paidAmount: paid.reduce((sum, inv) => sum + inv.amount, 0),
            paidCount: paid.length,
            draftCount: draft.length,
            sentCount: sent.length,
        }
    }, [invoices])

    // Filter options for quick access
    const filterOptions = [
        { id: null, label: 'Alla fakturor', count: stats.total, icon: FileText },
        { id: INVOICE_STATUS_LABELS.DRAFT, label: 'Utkast', count: stats.draftCount, icon: FileText },
        { id: INVOICE_STATUS_LABELS.SENT, label: 'Skickade', count: stats.sentCount, icon: Clock },
        { id: INVOICE_STATUS_LABELS.OVERDUE, label: 'Förfallna', count: stats.overdueCount, icon: AlertTriangle, variant: 'warning' as const },
        { id: INVOICE_STATUS_LABELS.PAID, label: 'Betalda', count: stats.paidCount, icon: TrendingUp, variant: 'success' as const },
    ]

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Create New Button */}
            <Button className="w-full gap-2" size="lg" onClick={onCreateNew}>
                <Plus className="h-4 w-4" />
                {text.invoices.create}
            </Button>

            {/* Financial Summary Card */}
            <Card className="flex-shrink-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Sammanfattning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Outstanding */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Utestående</span>
                        <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(stats.outstandingAmount)}
                        </span>
                    </div>
                    {/* Overdue */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Förfallet</span>
                        <span className={cn(
                            "text-sm font-semibold",
                            stats.overdueAmount > 0 ? "text-red-600 dark:text-red-500" : "text-muted-foreground"
                        )}>
                            {formatCurrency(stats.overdueAmount)}
                        </span>
                    </div>
                    {/* Paid (this period) */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Betalt</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                            {formatCurrency(stats.paidAmount)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card className="flex-1 overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base font-semibold">Snabbfilter</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/60">
                        {filterOptions.map((option) => {
                            const Icon = option.icon
                            const isActive = activeFilter === option.id
                            return (
                                <button
                                    key={option.id ?? 'all'}
                                    onClick={() => onFilterByStatus?.(option.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                                        "hover:bg-muted/50",
                                        isActive && "bg-primary/5 border-l-2 border-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn(
                                            "h-4 w-4",
                                            option.variant === 'warning' && "text-orange-500",
                                            option.variant === 'success' && "text-green-500",
                                            !option.variant && "text-muted-foreground"
                                        )} />
                                        <span className="text-sm font-medium">{option.label}</span>
                                    </div>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {option.count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
