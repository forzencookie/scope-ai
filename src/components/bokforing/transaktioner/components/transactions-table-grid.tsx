"use client"

import {
    Building2,
    Calendar,
    Banknote,
    CheckCircle2,
    CreditCard,
    ArrowRightLeft,
    Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useTextMode } from "@/providers/text-mode-provider"
import { TransactionWithAI } from "@/types"

interface TransactionsTableGridProps {
    transactions: TransactionWithAI[]
    selection: {
        isSelected: (id: string) => boolean
        toggleItem: (id: string) => void
        toggleAll: () => void
        allSelected: boolean
    }
    onTransactionClick: (transaction: TransactionWithAI) => void
    hasActiveFilters: boolean
    onAddTransaction: () => void
}

export function TransactionsTableGrid({
    transactions,
    selection,
    onTransactionClick,
    hasActiveFilters,
    onAddTransaction
}: TransactionsTableGridProps) {
    const { text } = useTextMode()

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px] px-2">
                {/* GridTable Header */}
                <GridTableHeader
                    columns={[
                        { label: text.labels?.supplier || "Leverantör", icon: Building2, span: 3 },
                        { label: text.labels?.date || "Datum", icon: Calendar, span: 2, hiddenOnMobile: true },
                        { label: text.labels?.amount || "Belopp", icon: Banknote, span: 2 },
                        { label: text.labels?.status || "Status", icon: CheckCircle2, span: 2 },
                        { label: text.labels?.account || "Konto", icon: CreditCard, span: 2, hiddenOnMobile: true },
                    ]}
                    trailing={
                        <Checkbox
                            checked={selection.allSelected && transactions.length > 0}
                            onCheckedChange={selection.toggleAll}
                        />
                    }
                />

                {/* GridTable Rows */}
                <GridTableRows>
                    {transactions.map((transaction) => (
                        <GridTableRow
                            key={transaction.id}
                            onClick={() => onTransactionClick(transaction)}
                            selected={selection.isSelected(transaction.id)}
                        >
                            <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                                {transaction.name}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate hidden md:block">
                                {transaction.date}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span className={cn(
                                    "font-medium tabular-nums",
                                    String(transaction.amount).startsWith("+") && "text-green-600 dark:text-green-400"
                                )}>
                                    {transaction.amount}
                                </span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <AppStatusBadge status={transaction.status} size="sm" />
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate hidden md:block">
                                {transaction.account}
                            </div>
                            <div
                                className={cn(
                                    "flex justify-end items-center transition-opacity",
                                    selection.isSelected(transaction.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={selection.isSelected(transaction.id)}
                                    onCheckedChange={() => selection.toggleItem(transaction.id)}
                                />
                            </div>
                        </GridTableRow>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{hasActiveFilters ? "Inga transaktioner matchar filtret" : "Inga transaktioner ännu"}</p>
                            {!hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={onAddTransaction}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {text.transactions?.newTransaction || "Ny betalning eller inkomst"}
                                </Button>
                            )}
                        </div>
                    )}
                </GridTableRows>
            </div>
        </div>
    )
}
