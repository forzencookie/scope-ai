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
import { PageHeader } from "@/components/shared"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

import { usePayslipsLogic } from "./use-payslips-logic"
import { PayslipsStats } from "./payslips-stats"
import { PayslipsTable } from "./payslips-table"
import { PayslipDetailOverlay } from "./PayslipDetailOverlay"

export const LonesbeskContent = memo(function LonesbeskContent() {
    const toast = useToast()
    const { navigateToAI } = useChatNavigation()

    const {
        // State
        filteredPayslips,
        isLoading,
        selectedIds,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,

        // Derived Data
        stats,

        // Overlay
        selectedPayslip, setSelectedPayslip,

        // Handlers
        handleRowClick,
        toggleSelection,
        toggleAll,
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
                navigateToAI({ prompt: `Jag vill ta bort lönebeskeden med följande ID: ${ids.join(', ')}.` })
                clearSelection()
            },
        },
    ]

    return (
        <div className="w-full space-y-4 md:space-y-6">
            {/* Page Heading */}
            <PageHeader
                title="Löneöversikt"
                subtitle={`Period: ${stats.currentPeriod} — ${stats.employeeCount} anställd${stats.employeeCount !== 1 ? "a" : ""}`}
                actions={
                    <Button
                        className="gap-2 shrink-0"
                        onClick={() => navigateToAI({ prompt: "Kör lönerna" })}
                    >
                        <Plus className="h-4 w-4" />
                        Ny lönekörning
                    </Button>
                }
            />

            {/* Stats Cards */}
            <PayslipsStats
                stats={stats}
                isLoading={isLoading}
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
                                    checked={statusFilter.includes('Utkast')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'Utkast'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'Utkast'))
                                    }}
                                >
                                    Utkast
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.includes('Godkänd')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'Godkänd'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'Godkänd'))
                                    }}
                                >
                                    Godkänd
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter.includes('Skickad')}
                                    onCheckedChange={(checked) => {
                                        if (checked) setStatusFilter([...statusFilter, 'Skickad'])
                                        else setStatusFilter(statusFilter.filter(s => s !== 'Skickad'))
                                    }}
                                >
                                    Skickad
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

            {/* Payslip Detail Overlay */}
            <PayslipDetailOverlay
                isOpen={!!selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
                payslip={selectedPayslip}
            />

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
