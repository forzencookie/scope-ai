"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, X, AlertTriangle, MessageSquare, Pencil } from "lucide-react"
import { useState } from "react"
import type { AIConfirmationRequest } from "@/lib/ai-tools/types"

interface ConfirmationCardProps {
    confirmation: AIConfirmationRequest
    onConfirm: () => void
    onCancel: () => void
    onComment?: (comment: string) => void
    onSuggestChange?: () => void
    isLoading?: boolean
    className?: string
}

/**
 * Confirmation Card for AI Actions
 * 
 * Displays a preview of an AI action that requires user confirmation
 * before execution. Used for write operations like creating receipts,
 * transactions, invoices, etc.
 * 
 * Philosophy: AI prepares, Human approves.
 */
export function ConfirmationCard({
    confirmation,
    onConfirm,
    onCancel,
    onComment,
    onSuggestChange,
    isLoading = false,
    className,
}: ConfirmationCardProps) {
    const [showComment, setShowComment] = useState(false)
    const [comment, setComment] = useState('')

    const handleSubmitComment = () => {
        if (comment.trim() && onComment) {
            onComment(comment.trim())
            setComment('')
            setShowComment(false)
        }
    }

    return (
        <div className={cn(
            "rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Pencil className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">{confirmation.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {confirmation.description}
                    </p>
                </div>
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

            {/* Comment input */}
            {showComment && (
                <div className="px-4 py-3 border-t border-border/40">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Skriv din kommentar eller justering..."
                        className="w-full rounded-lg border border-border bg-background p-3 text-sm
                            focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                    />
                    <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={handleSubmitComment} disabled={!comment.trim()}>
                            Skicka
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>
                            Avbryt
                        </Button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border/40 flex flex-wrap items-center gap-2">
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
                            Godkänn
                        </>
                    )}
                </Button>

                {onComment && !showComment && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComment(true)}
                        disabled={isLoading}
                    >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />
                        Kommentera
                    </Button>
                )}

                {onSuggestChange && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSuggestChange}
                        disabled={isLoading}
                    >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Ändra förslag
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="ml-auto"
                >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Avbryt
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
