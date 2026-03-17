"use client"

import { memo, useMemo } from "react"
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
import { useChatNavigation } from "@/hooks/use-chat-navigation"

import { usePayslipsLogic } from "./use-payslips-logic"
import { PayslipsStats } from "./payslips-stats"
import { PayslipsTable } from "./payslips-table"

export const LonesbeskContent = memo(function LonesbeskContent() {
    const toast = useToast()
    const { navigateToAI } = useChatNavigation()

    const {
        // State
        allPayslips,
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

        // Derived Data
        stats,

        // Handlers
        handleRowClick,
        toggleSelection,
        toggleAll,
        handleDelete,
        clearSelection
    } = usePayslipsLogic()

    // Derive the overall period status from current period payslips
    const periodStatus = useMemo(() => {
        if (!allPayslips.length) return "draft" as const
        const periodSlips = allPayslips.filter(p => p.period === stats.currentPeriod)
        if (!periodSlips.length) return "draft" as const
        const allPaid = periodSlips.every(p => p.status === "paid")
        if (allPaid) return "paid" as const
        const anyReview = periodSlips.some(p => p.status === "review")
        if (anyReview) return "review" as const
        return "draft" as const
    }, [allPayslips, stats.currentPeriod])

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

    const actionButton = (
        <Button onClick={() => navigateToAI({ prompt: "Kör lönerna" })} size="lg" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Ny lönekörning
        </Button>
    )

    return (
        <div className="w-full space-y-6">
            {/* Dashboard: Status Banner + Key Metrics */}
            <PayslipsStats
                stats={stats}
                periodStatus={periodStatus}
                isLoading={isLoading}
                actionButton={actionButton}
            />

            {/* Table Area — secondary section */}
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
                    onAddPayslip={() => navigateToAI({ prompt: "Kör lönerna" })}
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
