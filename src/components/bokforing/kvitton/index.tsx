"use client"

import { memo } from "react"
import { UploadCloud, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { BulkActionToolbar } from "@/components/shared/bulk-action-toolbar"
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog"
import { UnderlagDialog } from "../dialogs/underlag"
import { BookingDialog } from "../dialogs/bokforing"
import { RECEIPT_STATUSES } from "@/lib/status-types"

// Components
import { ReceiptsDashboard } from "./components/ReceiptsDashboard"
import { ReceiptsGrid } from "./components/ReceiptsGrid"

// Logic
import { useReceiptsLogic } from "./use-receipts-logic"

export const ReceiptsTable = memo(function ReceiptsTable() {
    const {
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
    } = useReceiptsLogic()

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{text.receipts.title || "Kvitton logg"}</h2>
                    <p className="text-muted-foreground">{text.receipts.subtitle || "Ladda upp och hantera dina kvitton"}</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto" onClick={() => setUploadDialogOpen(true)}>
                    <UploadCloud className="h-4 w-4" />
                    {text.receipts.upload || "Ladda upp"}
                </Button>
            </div>

            {/* Dashboard / Stats */}
            <ReceiptsDashboard
                stats={stats}
                onViewUnmatched={() => setStatusFilter([RECEIPT_STATUSES.PENDING])}
            />

            {/* Dialogs */}
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

            {/* Main Content */}
            <div>
                <div className="border-b-2 border-border/60" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                        {text.receipts.allReceipts || "Alla kvitton"}
                    </h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder={text.actions.search || "Sök..."}
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

            {/* Bulk Actions */}
            <BulkActionToolbar
                selectedCount={bulkSelection.selectedCount}
                selectedIds={bulkSelection.selectedIds}
                onClearSelection={bulkSelection.clearSelection}
                actions={bulkActions}
            />
        </div>
    )
})
