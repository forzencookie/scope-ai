"use client"

import { memo, useState, useCallback } from "react"
import {
    Plus,
    X,
    CreditCard,
    Clock,
    ChevronDown,
    ChevronUp,
    CheckSquare,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { accountClassLabels, type AccountClass } from "@/data/accounts"
import { VerifikationDialog } from "../verifikation-dialog"
import { BookingWizardDialog } from "../booking-wizard/BookingWizardDialog"

// Sub-components
import { VerifikationerStats } from "./components/VerifikationerStats"
import { VerifikationDetailsDialog } from "./components/VerifikationDetailsDialog"
import { VerifikationerGrid } from "./components/VerifikationerGrid"

// Logic & hooks
import { useVerificationsLogic } from "./use-verifications-logic"
import { usePendingBookings, type PendingBooking } from "@/hooks/use-pending-bookings"

// Source type labels for display
const SOURCE_TYPE_LABELS: Record<string, string> = {
    payslip: 'Lön',
    customer_invoice: 'Kundfaktura',
    supplier_invoice: 'Lev.faktura',
    invoice_payment: 'Betalning',
    transaction: 'Transaktion',
    dividend_decision: 'Utdelning',
    dividend_payment: 'Utdelningsbetalning',
    owner_withdrawal: 'Ägaruttag',
    ai_entry: 'AI-genererad',
}

export const VerifikationerTable = memo(function VerifikationerTable() {
    const toast = useToast()

    const {
        // State
        searchQuery, setSearchQuery,
        classFilter, setClassFilter,
        createDialogOpen, setCreateDialogOpen,
        detailsDialogOpen, setDetailsDialogOpen,
        selectedVerifikation,
        accountParam,

        // Actions
        setAccountFilter,
        handleViewDetails,
        handleBulkAction,

        // Data
        filteredVerifikationer,
        verifikationer,
        stats,
        selection,
        isLoading,
    } = useVerificationsLogic()

    // Pending bookings
    const {
        pendingBookings,
        pendingCount,
        bookItem,
        bookItems,
        dismissItems,
        wizardState,
        openWizard,
        closeWizard,
        invalidate: invalidatePending,
    } = usePendingBookings()

    const [pendingExpanded, setPendingExpanded] = useState(true)
    const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set())

    const togglePendingSelection = useCallback((id: string) => {
        setSelectedPendingIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const handleBatchBook = useCallback(async () => {
        if (selectedPendingIds.size === 0) return
        try {
            const result = await bookItems(Array.from(selectedPendingIds))
            setSelectedPendingIds(new Set())
            toast.success(
                "Bokförda",
                `${result.booked} verifikationer skapade.${result.errors.length > 0 ? ` ${result.errors.length} fel.` : ''}`
            )
        } catch {
            toast.error("Fel", "Kunde inte bokföra valda poster.")
        }
    }, [selectedPendingIds, bookItems, toast])

    const handleDismissPending = useCallback(async (ids: string[]) => {
        try {
            await dismissItems(ids)
            setSelectedPendingIds(new Set())
            toast.info("Avfärdade", `${ids.length} poster avfärdade.`)
        } catch {
            toast.error("Fel", "Kunde inte avfärda poster.")
        }
    }, [dismissItems, toast])

    // Wizard state for selected pending booking
    const selectedPendingBooking = wizardState.pendingBookingId
        ? pendingBookings.find((b) => b.id === wizardState.pendingBookingId) || null
        : null

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <PageHeader
                title={accountParam ? `Huvudbok: ${accountParam}` : "Verifikationer"}
                subtitle={accountParam
                    ? `Systematisk översikt för konto ${accountParam} (${filteredVerifikationer[0]?.kontoName || 'Laddar...'})`
                    : "Se alla bokförda transaktioner och verifikationer."}
                actions={
                    <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="truncate">Ny verifikation</span>
                    </Button>
                }
            />

            {/* Active Account Filter Badge */}
            {accountParam && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 animate-in fade-in slide-in-from-top-1">
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                        Filtrerat på konto: <span className="font-bold underline tabular-nums">{accountParam}</span>
                    </span>
                    <button
                        onClick={() => setAccountFilter(null)}
                        className="ml-auto text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <VerifikationerStats stats={stats} isLoading={isLoading} />

            {/* Pending Bookings Section */}
            {pendingCount > 0 && (
                <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <button
                        onClick={() => setPendingExpanded(!pendingExpanded)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="font-medium text-sm">Att bokföra</span>
                            <Badge variant="secondary" className="text-xs">
                                {pendingCount}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedPendingIds.size > 0 && (
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleBatchBook()
                                    }}
                                >
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    Bokför valda ({selectedPendingIds.size})
                                </Button>
                            )}
                            {pendingExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    </button>

                    {pendingExpanded && (
                        <div className="border-t border-amber-200 dark:border-amber-800">
                            {pendingBookings.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 border-amber-100 dark:border-amber-900 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 cursor-pointer transition-colors"
                                    onClick={() => openWizard(item.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-amber-300"
                                        checked={selectedPendingIds.has(item.id)}
                                        onChange={(e) => {
                                            e.stopPropagation()
                                            togglePendingSelection(item.id)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType}
                                    </Badge>
                                    <span className="text-sm truncate flex-1">{item.description}</span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {item.proposedDate}
                                    </span>
                                    <span className="text-sm font-medium tabular-nums">
                                        {item.proposedEntries
                                            .reduce((sum, e) => sum + (e.debit || 0), 0)
                                            .toLocaleString('sv-SE')}{' '}
                                        kr
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Booking Wizard Dialog */}
            <BookingWizardDialog
                open={wizardState.open}
                onOpenChange={(open) => !open && closeWizard()}
                sourceType={wizardState.sourceType}
                sourceId={wizardState.sourceId || ''}
                sourceData={wizardState.sourceData}
                pendingBookingId={wizardState.pendingBookingId || undefined}
                proposedEntries={selectedPendingBooking?.proposedEntries}
                proposedDate={selectedPendingBooking?.proposedDate}
                proposedSeries={selectedPendingBooking?.proposedSeries}
                proposedDescription={selectedPendingBooking?.description}
                initialMode="info"
                onBooked={(verificationId, verificationNumber) => {
                    closeWizard()
                    invalidatePending()
                    toast.success(
                        "Verifikation skapad",
                        `${verificationNumber} har bokförts.`
                    )
                }}
                onDismiss={() => {
                    if (wizardState.pendingBookingId) {
                        handleDismissPending([wizardState.pendingBookingId])
                    }
                    closeWizard()
                }}
            />

            {/* Create Dialog */}
            <VerifikationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onVerifikationCreated={() => {
                    toast.success("Verifikation skapad", "Kopplingen har sparats och status har uppdaterats till Bokförd.")
                }}
            />

            {/* Details Dialog */}
            <VerifikationDetailsDialog
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                verification={selectedVerifikation}
                onDownload={() => {
                    toast.info("Laddar ner...", `Verifikation #${selectedVerifikation?.id} förbereds för nedladdning.`)
                }}
                onApprove={() => {
                    toast.success("Verifikation godkänd", `Verifikation #${selectedVerifikation?.id} har godkänts.`)
                }}
            />

            {/* Table Section */}
            <div>
                <div className="border-b-2 border-border/60" />

                <div className="flex items-center justify-between gap-3 py-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                        Verifikationer
                    </h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök verifikation..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FilterButton
                                    label="Kontoklass"
                                    isActive={classFilter !== "all"}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]">
                                <DropdownMenuCheckboxItem
                                    checked={classFilter === "all"}
                                    onCheckedChange={() => setClassFilter("all")}
                                >
                                    Visa alla
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                {(Object.entries(accountClassLabels) as [string, string][]).map(([key, label]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        checked={classFilter === Number(key)}
                                        onCheckedChange={() => setClassFilter(Number(key) as AccountClass)}
                                    >
                                        {key} – {label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Verifications Table */}
            <VerifikationerGrid
                verifications={filteredVerifikationer}
                selection={selection}
                onViewDetails={handleViewDetails}
                onAccountFilter={(account) => setSearchQuery(account)}
            />

            {/* Bulk Actions */}
            <BulkActionToolbar
                selectedCount={selection.selectedCount}
                selectedIds={selection.selectedIds}
                onClearSelection={selection.clearSelection}
                actions={[
                    {
                        id: "export",
                        label: "Exportera",
                        onClick: () => handleBulkAction("Export"),
                        variant: "default"
                    },
                    {
                        id: "print",
                        label: "Skriv ut",
                        onClick: () => handleBulkAction("Utskrift"),
                        variant: "default"
                    }
                ]}
            />
        </div>
    )
})
