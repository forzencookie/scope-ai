import { FileText } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export interface InvoiceCardProps {
    invoice: {
        id?: string
        customer?: string
        amount?: number
        dueDate?: string
        status?: string
        invoiceNumber?: string
    }
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{invoice.customer || "Ny faktura"}</h4>
                        <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber && `#${invoice.invoiceNumber} • `}
                            Förfaller {invoice.dueDate}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(invoice.amount || 0)}</p>
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        invoice.status === "paid" ? "bg-green-500/10 text-green-600" :
                            invoice.status === "overdue" ? "bg-red-500/10 text-red-600" :
                                "bg-yellow-500/10 text-yellow-600"
                    )}>
                        {invoice.status === "paid" ? "Betald" :
                            invoice.status === "overdue" ? "Förfallen" : "Väntar"}
                    </span>
                </div>
            </div>
        </div>
    )
}
