import { useState, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/toast"
import { useReceiptsPaginated, useReceiptStats } from "@/hooks/use-receipts"
import { useBulkSelection, BulkAction } from "@/components/shared/bulk-action-toolbar"
import { useDeleteConfirmation } from "@/components/shared/delete-confirm-dialog"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { type Receipt } from '@/services/receipt-service'
import { type BookingData } from "../dialogs/bokforing"
import { BookOpen, Trash2, Archive, Download } from "lucide-react"
// import { RECEIPT_STATUSES } from "@/lib/status-types"

export function useReceiptsLogic() {
    const { text } = useTextMode()
    const { company } = useCompany()
    const toast = useToast()
    const isInvoiceMethod = company?.accountingMethod === 'invoice'

    // Local State
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
    const [selectedReceiptForBooking, setSelectedReceiptForBooking] = useState<Receipt | null>(null)

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

    const handleConfirmDelete = useCallback(() => {
        const id = deleteConfirmation.confirmDelete()
        if (id) {
            const receipt = receipts.find(r => r.id === id)
            fetchReceipts()
            toast.success("Underlag raderat", `${receipt?.supplier || 'Underlaget'} har raderats`)
        }
    }, [deleteConfirmation, receipts, fetchReceipts, toast])

    const handleViewDetails = useCallback((receipt: Receipt) => {
        setSelectedReceipt(receipt)
        setDetailsDialogOpen(true)
    }, [])

    const handleSaveReceipt = useCallback(async (data: { supplier: string; date: string; amount: string | number; moms: string | number; category: string; status: string; file?: File | null, fileName?: string }) => {
        try {
            const response = await fetch('/api/receipts/processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier: data.supplier,
                    date: data.date,
                    amount: typeof data.amount === 'string' ? parseFloat(data.amount) || 0 : data.amount,
                    moms: typeof data.moms === 'string' ? parseFloat(data.moms) || 0 : data.moms,
                    category: data.category,
                    status: data.status,
                    attachment: data.file ? data.file.name : (data.fileName || null),
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save receipt')
            }

            const result = await response.json()

            if (result.success && result.receipt) {
                fetchReceipts()
                toast.success("Underlag sparat", `${result.receipt.supplier} har lagts till`)
            }
        } catch (error) {
            console.error('Error saving receipt:', error)
            toast.error("Fel", "Kunde inte spara underlaget")
        }
    }, [fetchReceipts, toast])

    // Booking Logic
    const openBookingDialog = useCallback((receipt: Receipt) => {
        setSelectedReceiptForBooking(receipt)
        setBookingDialogOpen(true)
    }, [])

    const handleBook = useCallback(async (bookingData: BookingData) => {
        try {
            await fetch(`/api/receipts/${bookingData.entityId}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            })

            fetchReceipts()

            setBookingDialogOpen(false)
            setSelectedReceiptForBooking(null)

            if (bulkSelection.isSelected(bookingData.entityId)) {
                bulkSelection.toggleItem(bookingData.entityId)
            }

            toast.success("Kvitto bokfört", "Verifikation skapad")
        } catch (error) {
            console.error("Booking failed:", error)
            toast.error("Bokföring misslyckades", "Kunde inte bokföra kvittot")
        }
    }, [fetchReceipts, bulkSelection, toast])

    const handleBulkBooking = useCallback((ids: string[]) => {
        const firstId = ids[0]
        const receipt = receipts.find(r => r.id === firstId)
        if (receipt) openBookingDialog(receipt)
    }, [receipts, openBookingDialog])

    const bulkActions: BulkAction[] = useMemo(() => {
        const actions: BulkAction[] = []

        if (isInvoiceMethod) {
            actions.push({
                id: "book",
                label: "Bokför",
                icon: BookOpen,
                onClick: handleBulkBooking,
            })
        }

        actions.push(
            {
                id: "delete",
                label: text.actions.delete || "Radera",
                icon: Trash2,
                variant: "destructive",
                onClick: (ids) => {
                    fetchReceipts()
                    toast.success("Raderat", `${ids.length} underlag raderades`)
                    bulkSelection.clearSelection()
                },
            },
            {
                id: "archive",
                label: text.actions.archive || "Arkivera",
                icon: Archive,
                onClick: (ids) => {
                    toast.success("Arkiverat", `${ids.length} underlag arkiverades`)
                    bulkSelection.clearSelection()
                },
            },
            {
                id: "download",
                label: text.actions.download || "Ladda ner",
                icon: Download,
                onClick: (ids) => {
                    toast.info(text.actions.downloading || "Laddar ner", `Förbereder nedladdning av ${ids.length} underlag...`)
                    bulkSelection.clearSelection()
                },
            }
        )
        return actions
    }, [toast, bulkSelection, text, isInvoiceMethod, handleBulkBooking, fetchReceipts])

    return {
        // State
        text,
        isInvoiceMethod,
        uploadDialogOpen, setUploadDialogOpen,
        detailsDialogOpen, setDetailsDialogOpen,
        selectedReceipt,
        bookingDialogOpen, setBookingDialogOpen,
        selectedReceiptForBooking,
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
        handleSaveReceipt,
        openBookingDialog,
        handleBook
    }
}
