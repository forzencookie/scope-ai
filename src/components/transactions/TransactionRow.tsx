"use client"

import { memo } from "react"
import { Tag, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { Transaction, AISuggestion } from "@/types"
import { AISuggestionBadge } from "./AISuggestionBadge"
import { ICON_MAP } from "./constants"

export interface TransactionRowProps {
    /** Transaction data - required when isEmpty is false */
    transaction?: Transaction
    /** When true, renders an empty placeholder row */
    isEmpty?: boolean
    suggestion?: AISuggestion
    onApproveSuggestion?: () => void
    onRejectSuggestion?: () => void
    isApproved?: boolean
    isRejected?: boolean
}

// Memoize TransactionRow to prevent unnecessary re-renders in large lists
export const TransactionRow = memo(function TransactionRow({ 
    transaction, 
    isEmpty = false, 
    suggestion,
    onApproveSuggestion,
    onRejectSuggestion,
    isApproved = false,
    isRejected = false,
}: TransactionRowProps) {
    // Handle empty rows or missing transaction data safely
    const shouldRenderEmpty = isEmpty || !transaction
    const Icon = !shouldRenderEmpty && transaction?.iconName 
        ? (ICON_MAP[transaction.iconName] || Tag) 
        : Tag

    return (
        <tr className="border-b border-border/40 hover:bg-muted/30 data-[state=selected]:bg-muted group">
            {!shouldRenderEmpty && transaction ? (
                <>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium">{transaction.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {transaction.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        {suggestion && onApproveSuggestion && onRejectSuggestion ? (
                            <AISuggestionBadge
                                suggestion={suggestion}
                                onApprove={onApproveSuggestion}
                                onReject={onRejectSuggestion}
                                isApproved={isApproved}
                            />
                        ) : isRejected ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <X className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">Inte godkänd</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                        )}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <span className={cn(
                            transaction.amount.startsWith("+") ? "text-green-600" : "text-foreground"
                        )}>
                            {transaction.amount}
                        </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <AppStatusBadge status={transaction.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {transaction.account}
                    </td>
                    <td className="px-4 py-3">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                    </td>
                </>
            ) : (
                <>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">&nbsp;</td>
                    <td className="px-4 py-3">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                </>
            )}
        </tr>
    )
})
