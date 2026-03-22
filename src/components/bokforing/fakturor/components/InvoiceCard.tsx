import React from "react"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Send,
    Eye,
    CheckCircle2,
    Banknote,
    Download,
    FileX2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { INVOICE_STATUS_LABELS, SUPPLIER_INVOICE_STATUS_LABELS } from "@/lib/localization"
import { KanbanCard } from "@/components/shared/kanban"
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { UnifiedInvoice } from "../types"
import { useHighlight } from "@/hooks"

interface InvoiceCardProps {
    invoice: UnifiedInvoice
    onSend: (id: string) => void
    onMarkCustomerPaid: (id: string) => void
    onApproveSupplier: (id: string) => void
    onMarkSupplierPaid: (id: string) => void
    onDownloadPDF?: (invoice: UnifiedInvoice) => void
    onCreateCreditNote?: (id: string) => void
    onViewDetails?: (invoice: UnifiedInvoice) => void
}

export const InvoiceCard = React.memo(function InvoiceCard({
    invoice,
    onSend,
    onMarkCustomerPaid,
    onApproveSupplier,
    onMarkSupplierPaid,
    onDownloadPDF,
    onCreateCreditNote,
    onViewDetails,
}: InvoiceCardProps) {
    const isCustomer = invoice.direction === "in"
    const DirectionIcon = isCustomer ? ArrowDownLeft : ArrowUpRight
    const { highlightClass } = useHighlight(invoice.id)

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

            {/* Customer invoice actions */}
            {isCustomer && invoice.originalCustomerInvoice && (
                <>
                    {invoice.status === INVOICE_STATUS_LABELS.DRAFT && (
                        <DropdownMenuItem onClick={() => onSend(invoice.originalCustomerInvoice!.id)}>
                            <Send className="h-3.5 w-3.5 mr-2" />
                            Skicka faktura
                        </DropdownMenuItem>
                    )}
                    {invoice.status === INVOICE_STATUS_LABELS.SENT && (
                        <>
                            <DropdownMenuItem onClick={() => onMarkCustomerPaid(invoice.originalCustomerInvoice!.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Markera betald
                            </DropdownMenuItem>
                        </>
                    )}
                    {invoice.status !== INVOICE_STATUS_LABELS.DRAFT && invoice.status !== 'Krediterad' && onCreateCreditNote && (
                        <DropdownMenuItem onClick={() => onCreateCreditNote(invoice.originalCustomerInvoice!.id)}>
                            <FileX2 className="h-3.5 w-3.5 mr-2" />
                            Skapa kreditfaktura
                        </DropdownMenuItem>
                    )}
                </>
            )}

            {/* Supplier invoice actions */}
            {!isCustomer && invoice.originalSupplierInvoice && (
                <>
                    {invoice.status === SUPPLIER_INVOICE_STATUS_LABELS.RECEIVED && (
                        <DropdownMenuItem onClick={() => onApproveSupplier(invoice.originalSupplierInvoice!.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Attestera
                        </DropdownMenuItem>
                    )}
                    {invoice.status === SUPPLIER_INVOICE_STATUS_LABELS.APPROVED && (
                        <DropdownMenuItem onClick={() => onMarkSupplierPaid(invoice.originalSupplierInvoice!.id)}>
                            <Banknote className="h-3.5 w-3.5 mr-2" />
                            Markera betald
                        </DropdownMenuItem>
                    )}
                </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Radera</DropdownMenuItem>
        </KanbanCard>
    )
})
