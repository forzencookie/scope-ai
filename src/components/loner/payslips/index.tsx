"use client"

import {
    Bot,
    Plus,
    Send,
    Download,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
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
import { BulkActionToolbar, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"

import { usePayslipsLogic } from "./use-payslips-logic"
import { PayslipsStats } from "./payslips-stats"
import { PayslipsTable } from "./payslips-table"

// Dialogs
import { PayslipDetailsDialog } from "../dialogs/spec"
import { PayslipCreateDialog } from "../dialogs/create-payslip"

export function LonesbeskContent() {
    const navigateToAI = useNavigateToAIChat()
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
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                {/* Page Heading */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Lönekörning</h2>
                            <p className="text-muted-foreground mt-1">
                                Hantera löner och lönespecifikationer för dina anställda.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowAIDialog(true)} className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="sm:inline">Ny lönekörning</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payroll Period Summary */}
                {!isLoading && <PayslipsStats stats={stats} />}

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-löneförslag"
                    description="Baserat på tidigare månader och anställningsavtal."
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('lonebesked'))}
                />

                {/* AI Salary Wizard Dialog - Extracted Component */}
                <PayslipCreateDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                    onPayslipCreated={handlePayslipCreated}
                    currentPeriod={stats.currentPeriod}
                />

                {/* Payslip Details Dialog */}
                <PayslipDetailsDialog
                    payslip={selectedPayslip}
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    onSend={(id) => {
                        toast.success("Lönespecifikation skickad", "Skickades till anställd")
                    }}
                />

                {/* Table Title + Actions */}
                <div className="space-y-4 pt-8 border-t-2 border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Lönespecifikationer</h2>
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

                    <div className="rounded-md border border-border/60 overflow-hidden bg-card">
                        <PayslipsTable
                            data={filteredPayslips}
                            selectedIds={selectedIds}
                            onToggleAll={toggleAll}
                            onToggleSelection={toggleSelection}
                            onRowClick={handleRowClick}
                        />
                    </div>
                    
                    <BulkActionToolbar
                        selectedCount={selectedIds.size}
                        actions={bulkActions}
                        selectedIds={Array.from(selectedIds)}
                        onClearSelection={clearSelection}
                    />
                </div>
            </div>
        </main>
    )
}
