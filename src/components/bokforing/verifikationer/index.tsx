"use client"

import { memo, useState } from "react"
import {
    Plus,
    X,
    CreditCard,
    List,
    LayoutGrid,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { VerifikationDialog } from "../verifikation-dialog"
import { cn } from "@/lib/utils"

// Sub-components
import { VerifikationerStats } from "./components/VerifikationerStats"
import { VerifikationDetailsDialog } from "./components/VerifikationDetailsDialog"
import { VerifikationerGrid } from "./components/VerifikationerGrid"
import { AccountGroupView } from "./components/AccountGroupView"

// Logic
import { useVerificationsLogic } from "./use-verifications-logic"

type ViewMode = "list" | "accounts"

export const VerifikationerTable = memo(function VerifikationerTable() {
    const toast = useToast()
    const [viewMode, setViewMode] = useState<ViewMode>("accounts")

    const {
        // State
        setSearchQuery,
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
    } = useVerificationsLogic()

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <PageHeader
                title={accountParam ? `Huvudbok: ${accountParam}` : "Verifikationer"}
                subtitle={accountParam
                    ? `Systematisk översikt för konto ${accountParam} (${filteredVerifikationer[0]?.kontoName || 'Laddar...'})`
                    : "Se alla bokförda transaktioner och verifikationer."}
                actions={
                    <div className="hidden md:flex items-center gap-2">
                        {/* View mode toggle */}
                        {!accountParam && (
                            <div className="flex items-center border rounded-md">
                                <button
                                    onClick={() => setViewMode("accounts")}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-l-md transition-colors",
                                        viewMode === "accounts"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    Kontoplan
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-r-md transition-colors",
                                        viewMode === "list"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <List className="h-3.5 w-3.5" />
                                    Lista
                                </button>
                            </div>
                        )}
                        <Button size="sm" className="h-8 px-3 gap-1" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            Ny verifikation
                        </Button>
                    </div>
                }
            />

            {/* Mobile-only action button */}
            <div className="md:hidden w-full">
                <Button className="w-full" size="lg" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ny verifikation
                </Button>
            </div>

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
            <VerifikationerStats stats={stats} />

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

            {/* View Content */}
            {viewMode === "accounts" && !accountParam ? (
                <AccountGroupView
                    verifications={verifikationer}
                    onSelectAccount={(account) => setAccountFilter(account)}
                />
            ) : (
                <>
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
                </>
            )}
        </div>
    )
})
