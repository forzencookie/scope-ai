"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback, memo } from "react"
import { UploadCloud, Trash2, Download, Archive, BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { UnderlagDialog } from "../dialogs/underlag"
import { type ReceiptStatus, RECEIPT_STATUSES } from "@/lib/status-types"
import { type Receipt } from "@/lib/services/receipt-service"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { DeleteConfirmDialog, useDeleteConfirmation } from "@/components/shared/delete-confirm-dialog"
import { BookingDialog, type BookingData } from "../dialogs/bokforing"
import { receiptService } from "@/lib/services/receipt-service"
import { useReceiptsPaginated, useReceiptStats } from "@/hooks/use-receipts"

// New components
import { ReceiptsDashboard } from "./kvitton/components/ReceiptsDashboard"
import { ReceiptsGrid } from "./kvitton/components/ReceiptsGrid"


// Memoized to prevent unnecessary re-renders when parent state changes
export const ReceiptsTable = memo(function ReceiptsTable() {
    const { text } = useTextMode()
    const { company } = useCompany()
    const isInvoiceMethod = company?.accountingMethod === 'invoice'
    // Use paginated receipts hook
    const {
        receipts,
        isLoading,
        error: fetchError,
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

    // Use server-side stats
    const { stats: fetchedStats } = useReceiptStats()
    const stats = fetchedStats || { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }

    // Bulk selection
    const bulkSelection = useBulkSelection(receipts)

    const handleDeleteClick = (id: string) => {
        deleteConfirmation.requestDelete(id)
    }

    const handleConfirmDelete = () => {
        const id = deleteConfirmation.confirmDelete()
        if (id) {
            const receipt = receipts.find(r => r.id === id)
            fetchReceipts()
            toast.success("Underlag raderat", `${receipt?.supplier || 'Underlaget'} har raderats`)
        }
    }

    const handleViewDetails = (receipt: Receipt) => {
        setSelectedReceipt(receipt)
        setDetailsDialogOpen(true)
    }

    const handleSaveReceipt = async (data: any) => {
        try {
            const response = await fetch('/api/receipts/processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier: data.supplier,
                    date: data.date,
                    amount: data.amount,
                    moms: data.moms,
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
    }

    // Booking Logic
    const openBookingDialog = (receipt: Receipt) => {
        setSelectedReceiptForBooking(receipt)
        setBookingDialogOpen(true)
    }

    const handleBook = async (bookingData: BookingData) => {
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
    }

    const handleBulkBooking = (ids: string[]) => {
        const firstId = ids[0]
        const receipt = receipts.find(r => r.id === firstId)
        if (receipt) openBookingDialog(receipt)
    }

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
                label: text.actions.delete,
                icon: Trash2,
                variant: "destructive",
                onClick: (ids) => {
                    fetchReceipts()
                    toast.success(text.receipts.receiptsDeleted, `${ids.length} ${text.receipts.receiptsDeletedDesc}`)
                    bulkSelection.clearSelection()
                },
            },
            {
                id: "archive",
                label: text.actions.archive,
                icon: Archive,
                onClick: (ids) => {
                    toast.success(text.receipts.receiptsArchived, `${ids.length} ${text.receipts.receiptsArchivedDesc}`)
                    bulkSelection.clearSelection()
                },
            },
            {
                id: "download",
                label: text.actions.download,
                icon: Download,
                onClick: (ids) => {
                    toast.info(text.actions.downloading, `${text.receipts.preparingDownload} ${ids.length} ${text.receipts.receipts}...`)
                    bulkSelection.clearSelection()
                },
            }
        )
        return actions
    }, [toast, bulkSelection, text, receipts, isInvoiceMethod])

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{text.receipts.title}</h2>
                    <p className="text-muted-foreground">{text.receipts.subtitle}</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto" onClick={() => setUploadDialogOpen(true)}>
                    <UploadCloud className="h-4 w-4" />
                    {text.receipts.upload}
                </Button>
            </div>

            <ReceiptsDashboard
                stats={stats}
                onViewUnmatched={() => setStatusFilter([RECEIPT_STATUSES.PENDING])}
            />

            <DeleteConfirmDialog
                {...deleteConfirmation.dialogProps}
                onConfirm={handleConfirmDelete}
            />

            <UnderlagDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                mode="create"
                onSave={handleSaveReceipt}
            />

            <UnderlagDialog
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                mode="view"
                receipt={selectedReceipt || undefined}
            />

            <BookingDialog
                open={bookingDialogOpen}
                onOpenChange={setBookingDialogOpen}
                entity={selectedReceiptForBooking ? {
                    id: selectedReceiptForBooking.id,
                    name: selectedReceiptForBooking.supplier,
                    date: selectedReceiptForBooking.date,
                    amount: selectedReceiptForBooking.amount,
                    type: 'receipt',
                    status: selectedReceiptForBooking.status,
                    category: selectedReceiptForBooking.category
                } : null}
                onBook={handleBook}
            />

            <div>
                <div className="border-b-2 border-border/60" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{text.receipts.allReceipts}</h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder={text.actions.search}
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>
                </div>

                <ReceiptsGrid
                    receipts={receipts}
                    text={text}
                    selection={bulkSelection}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDeleteClick}
                    onBook={openBookingDialog}
                    onUpload={() => setUploadDialogOpen(true)}
                    isInvoiceMethod={isInvoiceMethod}
                    hasActiveFilters={Boolean(searchQuery || statusFilter.length > 0)}
                />

                {/* Pagination Footer */}
                {totalCount > pageSize && (
                    <div className="flex items-center justify-between px-2 py-4 mt-2 border-t border-border/40">
                        <div className="text-sm text-muted-foreground">
                            Visar {Math.min((page - 1) * pageSize + 1, totalCount)}-{Math.min(page * pageSize, totalCount)} av {totalCount} kvitton
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Föregående
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page * pageSize >= totalCount || isLoading}
                            >
                                Nästa
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <BulkActionToolbar
                selectedCount={bulkSelection.selectedCount}
                selectedIds={bulkSelection.selectedIds}
                onClearSelection={bulkSelection.clearSelection}
                actions={bulkActions}
            />
        </div>
    )
})

ReceiptsTable.displayName = 'ReceiptsTable'
