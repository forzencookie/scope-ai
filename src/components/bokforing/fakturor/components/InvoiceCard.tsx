import React from "react"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Eye,
    Download,
    Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { KanbanCard } from "@/components/shared/kanban"
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { UnifiedInvoice } from "../types"
import { useHighlight } from "@/hooks"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

interface InvoiceCardProps {
    invoice: UnifiedInvoice
    onDownloadPDF?: (invoice: UnifiedInvoice) => void
    onViewDetails?: (invoice: UnifiedInvoice) => void
}

export const InvoiceCard = React.memo(function InvoiceCard({
    invoice,
    onDownloadPDF,
    onViewDetails,
}: InvoiceCardProps) {
    const isCustomer = invoice.direction === "in"
    const DirectionIcon = isCustomer ? ArrowDownLeft : ArrowUpRight
    const { highlightClass } = useHighlight(invoice.id)
    const { navigateToAI } = useChatNavigation()

    return (
        <KanbanCard
            highlightClass={highlightClass}
            title={
                <span className="flex items-center gap-1.5">
                    <DirectionIcon className={cn(
                        "h-3.5 w-3.5",
                        isCustomer ? "text-green-600" : "text-red-600"
                    )} />
                    {invoice.number}
                </span>
            }
            subtitle={invoice.counterparty}
            amount={isCustomer ? invoice.totalAmount : -invoice.totalAmount}
            date={invoice.dueDate}
            isOverdue={
                (invoice.status === INVOICE_STATUS_LABELS.SENT || invoice.status === "Mottagen") &&
                !!invoice.dueDate && new Date(invoice.dueDate) < new Date()
            }
        >
            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails?.(invoice)}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                Visa detaljer
            </DropdownMenuItem>
            {isCustomer && onDownloadPDF && (
                <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Ladda ner PDF
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* All mutation actions route through Scooby */}
            <DropdownMenuItem onClick={() => navigateToAI({
                prompt: isCustomer
                    ? `Hantera faktura ${invoice.number} från ${invoice.counterparty} (${invoice.totalAmount} kr, status: ${invoice.status})`
                    : `Hantera leverantörsfaktura ${invoice.number} från ${invoice.counterparty} (${invoice.totalAmount} kr, status: ${invoice.status})`
            })}>
                <Bot className="h-3.5 w-3.5 mr-2" />
                Hantera med Scooby
            </DropdownMenuItem>
        </KanbanCard>
    )
})
