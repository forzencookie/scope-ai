"use client"

import { memo, useState } from "react"
import {
    X, Search, ArrowRightLeft, Plus,
    Building2, Coffee, Smartphone, Plane, Briefcase, Tag, User,
    Zap, Megaphone, Monitor, Shield, Landmark, Receipt, CreditCard,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import type { Transaction } from "@/types"

// =============================================================================
// Constants
// =============================================================================

export const ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    Tag,
    User,
    Zap,
    Megaphone,
    Monitor,
    Shield,
    Landmark,
    Receipt,
    CreditCard,
}

// =============================================================================
// TransactionRow
// =============================================================================

export interface TransactionRowProps {
    transaction?: Transaction
    onClick?: () => void
    selected?: boolean
    onToggleSelection?: () => void
}

export const TransactionRow = memo(function TransactionRow({
    transaction,
    onClick,
    selected,
    onToggleSelection,
}: TransactionRowProps) {
    if (!transaction) return null

    const Icon = transaction.iconName
        ? (ICON_MAP[transaction.iconName] || Tag)
        : Tag

    return (
        <tr
            className={cn(
                "border-b border-border/40 hover:bg-muted/30 group",
                selected && "bg-muted",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-medium">{transaction.name}</span>
            </td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{transaction.date}</td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div>
                    <div className={cn("font-medium tabular-nums", transaction.amount.startsWith("+") ? "text-green-600 dark:text-green-500/70" : "text-foreground")}>
                        {transaction.amount}
                    </div>
                    {transaction.vatAmount !== undefined && (
                        <div className="text-xs text-muted-foreground">
                            Moms {Math.abs(transaction.vatAmount).toLocaleString("sv-SE")} kr
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <AppStatusBadge status={transaction.status} size="sm" />
            </td>
            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{transaction.account}</td>
            {onToggleSelection && (
                <td className="w-10 px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end pr-2">
                        <Checkbox
                            checked={selected}
                            onCheckedChange={onToggleSelection}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </td>
            )}
        </tr>
    )
})

// =============================================================================
// TransactionsEmptyState
// =============================================================================

interface TransactionsEmptyStateProps {
    hasFilters: boolean
    onAddTransaction: () => void
}

export function TransactionsEmptyState({ hasFilters, onAddTransaction }: TransactionsEmptyStateProps) {
    return (
        <tr className="h-[200px]">
            <td colSpan={6} className="text-center">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        {hasFilters ? (
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                        ) : (
                            <ArrowRightLeft className="h-8 w-8 text-muted-foreground/50" />
                        )}
                    </div>
                    <p className="font-medium text-foreground mb-1">
                        {hasFilters ? "Inga transaktioner matchar din sökning" : "Här är det tomt — ännu!"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {hasFilters
                            ? "Försök med andra söktermer eller avaktivera något filter"
                            : "Koppla din bank så börjar vi jobba — du kommer älska hur enkelt det blir"}
                    </p>
                    {!hasFilters && (
                        <Button size="sm" onClick={onAddTransaction}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Lägg till transaktion
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    )
}

// =============================================================================
// NewTransactionDialog
// =============================================================================

interface NewTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lägg till transaktion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Beskrivning</label>
                        <Input placeholder="Ange beskrivning..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Belopp</label>
                            <Input placeholder="0.00 kr" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Datum</label>
                            <Input type="date" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Konto</label>
                        <Input placeholder="Välj konto..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                    </DialogClose>
                    <Button>Lägg till</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// =============================================================================
// TransactionDetailsDialog
// =============================================================================

interface TransactionDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

export function TransactionDetailsDialog({
    open,
    onOpenChange,
    transaction,
}: TransactionDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Transaktionsdetaljer</DialogTitle>
                </DialogHeader>
                {transaction && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Beskrivning</p>
                                <p className="font-medium">{transaction.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Datum</p>
                                <p className="font-medium">{transaction.date}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Belopp</p>
                                <p className={cn("font-medium tabular-nums", transaction.amount.startsWith("+") ? "text-green-600 dark:text-green-500/70" : "")}>
                                    {transaction.amount}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <AppStatusBadge status={transaction.status} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Konto</p>
                                <p className="font-medium">{transaction.account}</p>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Stäng</Button>
                    </DialogClose>
                    <Button>Bokför</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
