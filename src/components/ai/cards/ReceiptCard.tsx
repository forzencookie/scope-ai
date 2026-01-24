import { Receipt } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface ReceiptCardProps {
    receipt: {
        id?: string
        vendor?: string
        amount?: number
        date?: string
        category?: string
        description?: string
    }
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{receipt.vendor || "Nytt kvitto"}</h4>
                        <p className="text-sm text-muted-foreground">{receipt.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(receipt.amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">{receipt.category}</p>
                </div>
            </div>
            {receipt.description && (
                <p className="text-sm text-muted-foreground border-t pt-3">{receipt.description}</p>
            )}
        </div>
    )
}
