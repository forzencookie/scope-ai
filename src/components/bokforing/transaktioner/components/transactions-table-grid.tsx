"use client"

import { useMemo } from "react"
import {
    Building2,
    Calendar,
    Banknote,
    CheckCircle2,
    CreditCard,
    ArrowRightLeft,
    Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useTextMode } from "@/providers/text-mode-provider"
import { TransactionWithAI } from "@/types"
import { ActionEmptyState } from "@/components/shared"
import { useHighlight } from "@/hooks"

const UNBOOKED_STATUSES = ["Att bokföra", "Saknar underlag"]

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

    const { unbooked, booked } = useMemo(() => {
        const unbooked: TransactionWithAI[] = []
        const booked: TransactionWithAI[] = []
        for (const t of transactions) {
            if (UNBOOKED_STATUSES.includes(t.status)) {
                unbooked.push(t)
            } else {
                booked.push(t)
            }
        }
        return { unbooked, booked }
    }, [transactions])

    const hasReceipt = (transaction: TransactionWithAI) =>
        transaction.attachments && transaction.attachments.length > 0

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

                {/* Unbooked section */}
                {unbooked.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 px-1 pt-3 pb-1.5">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                                {unbooked.length} att hantera
                            </span>
                        </div>
                        <GridTableRows>
                            {unbooked.map((t) => (
                                <TransactionRow 
                                    key={t.id} 
                                    transaction={t} 
                                    isUnbooked={true} 
                                    selection={selection} 
                                    onTransactionClick={onTransactionClick}
                                    hasReceipt={!!hasReceipt(t)}
                                />
                            ))}
                        </GridTableRows>
                    </>
                )}

                {/* Separator between unbooked and booked */}
                {unbooked.length > 0 && booked.length > 0 && (
                    <div className="flex items-center gap-3 py-3 px-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                            Hanterade
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                )}

                {/* Booked section */}
                {booked.length > 0 && (
                    <GridTableRows>
                        {booked.map((t) => (
                            <TransactionRow 
                                key={t.id} 
                                transaction={t} 
                                isUnbooked={false} 
                                selection={selection} 
                                onTransactionClick={onTransactionClick}
                                hasReceipt={!!hasReceipt(t)}
                            />
                        ))}
                    </GridTableRows>
                )}

                {/* Empty state — only when both groups are empty */}
                {transactions.length === 0 && (
                    <ActionEmptyState
                        icon={ArrowRightLeft}
                        title={hasActiveFilters ? "Inga matchningar" : "Inga transaktioner än"}
                        description={hasActiveFilters 
                            ? "Vi hittade inga transaktioner som matchar dina filter. Prova att ändra filterinställningarna."
                            : "Ditt transaktionsflöde är tomt. Fråga Scooby att hämta de senaste transaktionerna från din bank."
                        }
                        actionLabel={!hasActiveFilters ? "Hämta från bank" : undefined}
                        actionPrompt="Hämta mina senaste banktransaktioner"
                    />
                )}
            </div>
        </div>
    )
}

function TransactionRow({ 
    transaction, 
    isUnbooked, 
    selection, 
    onTransactionClick,
    hasReceipt
}: { 
    transaction: TransactionWithAI, 
    isUnbooked: boolean, 
    selection: any, 
    onTransactionClick: any,
    hasReceipt: boolean
}) {
    const { highlightClass } = useHighlight(transaction.id)

    return (
        <GridTableRow
            onClick={() => onTransactionClick(transaction)}
            selected={selection.isSelected(transaction.id)}
            className={cn(
                highlightClass,
                isUnbooked && !highlightClass && "border-l-2 border-l-amber-400 dark:border-l-amber-500 pl-1",
                !isUnbooked && "opacity-80 hover:opacity-100"
            )}
        >
            <div className="col-span-3 font-medium truncate flex items-center gap-2">
                {hasReceipt ? (
                    <div className="w-7 h-7 rounded bg-muted overflow-hidden shrink-0 border border-border/50 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={transaction.attachments![0]}
                            alt="Kvitto"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as any).style.display = 'none';
                                (e.target as any).parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold bg-muted">K</div>';
                            }}
                        />
                    </div>
                ) : (
                    isUnbooked && (
                        <div className="w-7 h-7 rounded bg-amber-500/10 flex items-center justify-center shrink-0 border border-dashed border-amber-500/30" title="Saknar kvitto">
                            <Receipt className="h-3.5 w-3.5 text-amber-600/50" />
                        </div>
                    )
                )}
                <span className="truncate">{transaction.name}</span>
            </div>
            <div className="col-span-2 text-muted-foreground truncate hidden md:block text-xs uppercase font-medium tracking-wider">
                {transaction.date}
            </div>
            <div className="col-span-2">
                <span className={cn(
                    "font-medium tabular-nums",
                    String(transaction.amount).startsWith("+") ? "text-green-600 dark:text-green-400" : "text-foreground"
                )}>
                    {transaction.amount}
                </span>
            </div>
            <div className="col-span-2">
                <AppStatusBadge status={transaction.status} size="sm" />
            </div>
            <div className="col-span-2 text-muted-foreground truncate hidden md:block font-mono text-[11px]">
                {transaction.account}
            </div>
            <div
                className={cn(
                    "col-span-1 flex justify-end items-center transition-opacity",
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
    )
}
