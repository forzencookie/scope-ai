"use client"

import { memo } from "react"
import {
    X,
    CreditCard,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, PageHeader } from "@/components/shared"
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

// Sub-components
import { VerifikationerStats } from "./components/VerifikationerStats"
import { VerifikationDetailsDialog } from "./components/VerifikationDetailsDialog"
import { VerifikationerGrid } from "./components/VerifikationerGrid"

// Logic & hooks
import { useVerificationsLogic } from "./use-verifications-logic"

export const VerifikationerTable = memo(function VerifikationerTable() {
    const toast = useToast()

    const {
        // State
        searchQuery, setSearchQuery,
        classFilter, setClassFilter,
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
        isLoading,
    } = useVerificationsLogic()




    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <PageHeader
                title={accountParam ? `Huvudbok: ${accountParam}` : "Verifikationer"}
                subtitle={accountParam
                    ? `Systematisk översikt för konto ${accountParam} (${filteredVerifikationer[0]?.kontoName || 'Laddar...'})`
                    : "Se alla bokförda transaktioner och verifikationer."}
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

            {/* Details Dialog */}
            <VerifikationDetailsDialog
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                verification={selectedVerifikation}
                onDownload={() => {
                    toast.info("Laddar ner...", `Verifikation ${selectedVerifikation?.verificationNumber} förbereds för nedladdning.`)
                }}
                onApprove={() => {
                    toast.success("Verifikation godkänd", `Verifikation ${selectedVerifikation?.verificationNumber} har godkänts.`)
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
