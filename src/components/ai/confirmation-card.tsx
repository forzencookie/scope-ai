"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, X, AlertTriangle } from "lucide-react"
import type { AIConfirmationRequest } from "@/lib/ai-tools/types"

interface ConfirmationCardProps {
    confirmation: AIConfirmationRequest
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
    className?: string
}

/**
 * Confirmation Card for AI Actions
 * 
 * Displays a preview of an AI action that requires user confirmation
 * before execution. Used for write operations like creating receipts,
 * transactions, invoices, etc.
 */
export function ConfirmationCard({
    confirmation,
    onConfirm,
    onCancel,
    isLoading = false,
    className,
}: ConfirmationCardProps) {
    return (
        <div className={cn(
            "rounded-lg border-2 border-border/60 bg-card overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
                <h3 className="font-medium text-sm">{confirmation.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {confirmation.description}
                </p>
            </div>

            {/* Summary Items */}
            <div className="px-4 py-3 space-y-2">
                {confirmation.summary.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Warnings */}
            {confirmation.warnings && confirmation.warnings.length > 0 && (
                <div className="px-4 py-2 border-t border-border/40 bg-amber-500/10">
                    {confirmation.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border/40 flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Avbryt
                </Button>
                <Button
                    size="sm"
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin mr-1">⏳</span>
                            Sparar...
                        </>
                    ) : (
                        <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Proceed
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

/**
 * Receipt Card for displaying created receipts
 */
interface ReceiptCardProps {
    receipt: {
        id: string
        supplier: string
        amount: string
        date: string
        category: string
        status?: string
    }
    className?: string
}

export function ReceiptCard({ receipt, className }: ReceiptCardProps) {
    return (
        <div className={cn(
            "rounded-lg border-2 border-border/60 bg-card overflow-hidden",
            className
        )}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                <span className="text-sm font-medium flex items-center gap-2">
                    🧾 Kvitto
                </span>
                <span className="text-sm font-semibold">{receipt.amount}</span>
            </div>
            <div className="px-4 py-3 space-y-1">
                <div className="font-medium">{receipt.supplier}</div>
                <div className="text-xs text-muted-foreground">
                    {receipt.date} • {receipt.category}
                </div>
                {receipt.status && (
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                        Status: {receipt.status}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Transaction Card for displaying created transactions
 */
interface TransactionCardProps {
    transaction: {
        id: string
        name: string
        amount: string
        date: string
        category: string
        account: string
        status?: string
    }
    className?: string
}

export function TransactionCard({ transaction, className }: TransactionCardProps) {
    const isPositive = transaction.amount.startsWith('+')

    return (
        <div className={cn(
            "rounded-lg border-2 border-border/60 bg-card overflow-hidden",
            className
        )}>
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                <span className="text-sm font-medium flex items-center gap-2">
                    💳 Transaktion
                </span>
                <span className={cn(
                    "text-sm font-semibold",
                    isPositive ? "text-green-600 dark:text-green-500" : "text-foreground"
                )}>
                    {transaction.amount}
                </span>
            </div>
            <div className="px-4 py-3 space-y-1">
                <div className="font-medium">{transaction.name}</div>
                <div className="text-xs text-muted-foreground">
                    {transaction.date} • {transaction.category} • {transaction.account}
                </div>
                {transaction.status && (
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                        Status: {transaction.status}
                    </div>
                )}
            </div>
        </div>
    )
}
