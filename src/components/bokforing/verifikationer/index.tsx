"use client"

import { memo } from "react"
import {
    Plus,
    X,
    CreditCard
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { VerifikationDialog } from "../verifikation-dialog"

// Sub-components
import { VerifikationerStats } from "./components/VerifikationerStats"
import { VerifikationDetailsDialog } from "./components/VerifikationDetailsDialog"
import { VerifikationerGrid } from "./components/VerifikationerGrid"

// Logic
import { useVerificationsLogic } from "./use-verifications-logic"

export const VerifikationerTable = memo(function VerifikationerTable() {
    const toast = useToast()
    
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
                    <Button size="sm" className="h-8 w-full sm:w-auto px-3 gap-1" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        <span className="sm:inline">Ny verifikation</span>
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
            
            {/* Main Grid/Table */}
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
