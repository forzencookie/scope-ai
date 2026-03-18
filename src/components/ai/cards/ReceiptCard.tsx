import React from "react"
import { Receipt as ReceiptIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Receipt } from "@/lib/ai-schema"

export interface ReceiptCardProps {
    receipt: Receipt
}

export const ReceiptCard = React.memo(function ReceiptCard({ receipt }: ReceiptCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <ReceiptIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm leading-tight">{receipt.vendor}</h4>
                        <p className="text-xs text-muted-foreground">{receipt.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(receipt.amount)}</p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">{receipt.category}</p>
                </div>
            </div>
            {receipt.description && (
                <p className="text-xs text-muted-foreground border-t pt-3 leading-relaxed italic">{receipt.description}</p>
            )}
        </div>
    )
})
