"use client"

import { memo } from "react"
import { Plus, Send, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, type BulkAction } from "@/components/shared"

import { usePayslipsLogic } from "./use-payslips-logic"
import { PayslipsStats } from "./payslips-stats"
import { PayslipsTable } from "./payslips-table"

// Dialogs
import { PayslipDetailsDialog } from "../dialogs/spec"
import { PayslipCreateDialog } from "../dialogs/create-payslip"

export const LonesbeskContent = memo(function LonesbeskContent() {
    const toast = useToast()

    const {
        // State
        filteredPayslips,
        isLoading,
        selectedIds,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        selectedPayslip,

        // Dialog Control
        viewDialogOpen,
        setViewDialogOpen,
        showAIDialog,
        setShowAIDialog,

        // Derived Data
        stats,

        // Handlers
        handleRowClick,
        toggleSelection,
        toggleAll,
        handlePayslipCreated,
        handleDelete,
        clearSelection
    } = usePayslipsLogic()

    const bulkActions: BulkAction[] = [
        {
            id: 'send',
            label: 'Skicka',
            icon: Send,
            onClick: (ids) => {
                toast.success(`${ids.length} lönebesked skickade`, "Anställda har notifierats via e-post")
                clearSelection()
            },
        },
        {
            id: 'download',
            label: 'Ladda ner PDF',
            icon: Download,
            onClick: (ids) => {
                toast.info(`Laddar ner ${ids.length} PDF-filer...`, "Förbereder nedladdning")
            },
        },
        {
            id: 'delete',
            label: 'Ta bort',
            icon: Trash2,
            variant: 'destructive' as const,
            onClick: (ids) => {
                handleDelete(ids)
                toast.success(`${ids.length} lönebesked borttagna`, "Åtgärden kan inte ångras")
            },
        },
    ]

    return (
        <div className="w-full space-y-4 md:space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Lönekörning</h2>
                    <p className="text-muted-foreground mt-1">Hantera löner och lönespecifikationer för dina anställda.</p>
                </div>
                <Button onClick={() => setShowAIDialog(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Ny lönekörning
                </Button>
            </div>

            {/* Stats Overview */}
            <PayslipsStats stats={stats} isLoading={isLoading} />

            {/* Dialogs */}
            <PayslipCreateDialog
                open={showAIDialog}
                onOpenChange={setShowAIDialog}
                onPayslipCreated={handlePayslipCreated}
                currentPeriod={stats.currentPeriod}
            />

            <PayslipDetailsDialog
                payslip={selectedPayslip}
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                onSend={() => {
                    toast.success("Lönespecifikation skickad", "Skickades till anställd")
                }}
            />

            {/* Table Area */}
            <div>
                <div className="border-b-2 border-border/60" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                        Lönespecifikationer
                    </h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök anställd..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FilterButton
                                    label="Status"
                                    isActive={statusFilter.length > 0}
                                    activeCount={statusFilter.length}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.includes('draft')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'draft'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'draft'))
                                    }}
                                >
                                    Utkast
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.includes('review')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'review'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'review'))
                                    }}
                                >
                                    Granskas
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.includes('paid')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'paid'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'paid'))
                                    }}
                                >
                                    Utbetald
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.length === 0}
                                    onCheckedChange={() => setStatusFilter([])}
                                >
                                    Visa alla
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <PayslipsTable
                    data={filteredPayslips}
                    selectedIds={selectedIds}
                    onToggleAll={toggleAll}
                    onToggleSelection={toggleSelection}
                    onRowClick={handleRowClick}
                    onAddPayslip={() => setShowAIDialog(true)}
                />
            </div>

            {/* Bulk Action Toolbar */}
            <BulkActionToolbar
                selectedCount={selectedIds.size}
                actions={bulkActions}
                selectedIds={Array.from(selectedIds)}
                onClearSelection={clearSelection}
            />
        </div>
    )
})
