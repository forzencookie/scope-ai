import { Receipt } from "@/data/receipts"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { Building2, Calendar, Tag, Banknote, CheckCircle2, Paperclip, MoreHorizontal, FileText, Plus } from "lucide-react"
import { CategoryBadge, AmountText } from "@/components/ui/table-shell"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { parseAmount, cn } from "@/lib/utils"
import { BookOpen } from "lucide-react"
import { useHighlight } from "@/hooks"

interface ReceiptsGridProps {
    receipts: Receipt[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text: any
    selection: {
        isSelected: (id: string) => boolean
        toggleItem: (id: string) => void
        toggleAll: () => void
        allSelected: boolean
    }
    onViewDetails: (receipt: Receipt) => void
    onDelete: (id: string) => void
    onBook?: (receipt: Receipt) => void
    onUpload: () => void
    isInvoiceMethod: boolean
    hasActiveFilters: boolean
}

export function ReceiptsGrid({
    receipts,
    text,
    selection,
    onViewDetails,
    onDelete,
    onBook,
    onUpload,
    isInvoiceMethod,
    hasActiveFilters
}: ReceiptsGridProps) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[800px] px-2">
                <GridTableHeader
                    columns={[
                        { label: text.receipts.supplier, icon: Building2, span: 3 },
                        { label: text.labels.date, icon: Calendar, span: 2 },
                        { label: text.receipts.category, icon: Tag, span: 2 },
                        { label: text.labels.amount, icon: Banknote, span: 2, align: "right" },
                        { label: text.labels.status, icon: CheckCircle2, span: 2, align: "center" },
                    ]}
                    trailing={
                        <div className="flex items-center justify-end gap-3">
                            <Paperclip className="h-3 w-3" />
                            <Checkbox
                                checked={selection.allSelected && receipts.length > 0}
                                onCheckedChange={selection.toggleAll}
                                aria-label={text.actions.selectAll}
                            />
                        </div>
                    }
                />

                <GridTableRows>
                    {receipts.map((receipt) => (
                        <ReceiptRow 
                            key={receipt.id}
                            receipt={receipt}
                            text={text}
                            selection={selection}
                            onViewDetails={onViewDetails}
                            onDelete={onDelete}
                            onBook={onBook}
                            isInvoiceMethod={isInvoiceMethod}
                        />
                    ))}
                    {receipts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>{hasActiveFilters
                                ? text.errors.noMatchingReceipts
                                : text.receipts.empty}</p>
                        </div>
                    )}
                </GridTableRows>

                <Button variant="ghost" className="w-full border-2 border-dashed border-border/50 text-muted-foreground h-12" onClick={onUpload}>
                    <Plus className="h-4 w-4 mr-2" />
                    {text.receipts.upload}
                </Button>
            </div>
        </div>
    )
}

// Individual row component with highlight support
interface ReceiptRowProps {
    receipt: Receipt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text: any
    selection: {
        isSelected: (id: string) => boolean
        toggleItem: (id: string) => void
    }
    onViewDetails: (receipt: Receipt) => void
    onDelete: (id: string) => void
    onBook?: (receipt: Receipt) => void
    isInvoiceMethod: boolean
}

function ReceiptRow({
    receipt,
    text,
    selection,
    onViewDetails,
    onDelete,
    onBook,
    isInvoiceMethod
}: ReceiptRowProps) {
    const { highlightClass } = useHighlight(receipt.id)

    return (
        <GridTableRow
            selected={selection.isSelected(receipt.id)}
            className={cn("group", highlightClass)}
        >
            <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                {receipt.supplier}
            </div>
            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground text-sm truncate">
                {receipt.date}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
                <CategoryBadge>
                    {receipt.category}
                </CategoryBadge>
            </div>
            <div style={{ gridColumn: 'span 2' }} className="text-right truncate">
                <AmountText value={parseAmount(receipt.amount)} />
            </div>
            <div style={{ gridColumn: 'span 2' }} className="flex justify-center">
                <AppStatusBadge
                    status={receipt.status}
                    size="sm"
                />
            </div>
            <div style={{ gridColumn: 'span 1' }} className="flex items-center justify-end gap-2">
                {receipt.attachment && (
                    <div className="text-muted-foreground bg-muted p-1 rounded-sm" title={receipt.attachment}>
                        <Paperclip className="h-3 w-3" />
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" >
                            <span className="sr-only">{text.actions.openMenu}</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{text.labels.actions}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(receipt)}>
                            {text.actions.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDetails(receipt)}>
                            {text.actions.edit}
                        </DropdownMenuItem>
                        {isInvoiceMethod && onBook && (
                            <DropdownMenuItem onClick={() => onBook(receipt)}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Bokför
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(receipt.id)}>
                            {text.actions.delete}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Checkbox
                    checked={selection.isSelected(receipt.id)}
                    onCheckedChange={() => selection.toggleItem(receipt.id)}
                    aria-label={`${text.actions.select} ${receipt.supplier}`}
                />
            </div>
        </GridTableRow>
    )
}
