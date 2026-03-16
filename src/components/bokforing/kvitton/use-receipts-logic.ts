import { useState, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/toast"
import { useReceiptsPaginated, useReceiptStats } from "@/hooks/use-receipts"
import { useBulkSelection, BulkAction } from "@/components/shared/bulk-action-toolbar"
import { useDeleteConfirmation } from "@/components/shared/delete-confirm-dialog"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { type Receipt } from '@/services/receipt-service'
import { Trash2, Archive, Download } from "lucide-react"
// import { RECEIPT_STATUSES } from "@/lib/status-types"

export function useReceiptsLogic() {
    const { text } = useTextMode()
    const { company } = useCompany()
    const toast = useToast()
    const isInvoiceMethod = company?.accountingMethod === 'invoice'

    // Local State
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)

    // Hooks
    const deleteConfirmation = useDeleteConfirmation()

    const {
        receipts,
        isLoading,
        error: _fetchError,
        page,
        setPage,
        pageSize,
        totalCount,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        refetch: fetchReceipts
    } = useReceiptsPaginated(20)

    const { stats: fetchedStats } = useReceiptStats()
    const stats = fetchedStats || { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }

    const bulkSelection = useBulkSelection(receipts)

    // Handlers
    const handleDeleteClick = useCallback((id: string) => {
        deleteConfirmation.requestDelete(id)
    }, [deleteConfirmation])

    const handleConfirmDelete = useCallback(async () => {
        const id = deleteConfirmation.confirmDelete()
        if (id) {
            const receipt = receipts.find(r => r.id === id)
            try {
                const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
                if (!res.ok) {
                    toast.error("Kunde inte radera", "Försök igen senare")
                    return
                }
            } catch {
                toast.error("Kunde inte radera", "Nätverksfel")
                return
            }
            fetchReceipts()
            toast.success("Underlag raderat", `${receipt?.supplier || 'Underlaget'} har raderats`)
        }
    }, [deleteConfirmation, receipts, fetchReceipts, toast])

    const handleViewDetails = useCallback((receipt: Receipt) => {
        setSelectedReceipt(receipt)
        setDetailsDialogOpen(true)
    }, [])


    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "delete",
            label: text.actions.delete || "Radera",
            icon: Trash2,
            variant: "destructive" as const,
            onClick: (ids: string[]) => {
                fetchReceipts()
                toast.success("Raderat", `${ids.length} underlag raderades`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "archive",
            label: text.actions.archive || "Arkivera",
            icon: Archive,
            onClick: (ids: string[]) => {
                toast.success("Arkiverat", `${ids.length} underlag arkiverades`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "download",
            label: text.actions.download || "Ladda ner",
            icon: Download,
            onClick: (ids: string[]) => {
                toast.info(text.actions.downloading || "Laddar ner", `Förbereder nedladdning av ${ids.length} underlag...`)
                bulkSelection.clearSelection()
            },
        },
    ], [toast, bulkSelection, text, fetchReceipts])

    return {
        // State
        text,
        isInvoiceMethod,
        detailsDialogOpen, setDetailsDialogOpen,
        selectedReceipt,
        deleteConfirmation,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,

        // Data
        receipts,
        stats,
        isLoading,
        bulkActions,
        bulkSelection,

        // Pagination
        page, setPage, pageSize, totalCount,

        // Handlers
        handleDeleteClick,
        handleConfirmDelete,
        handleViewDetails,
    }
}
