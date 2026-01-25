"use client"

import {
    Bot,
    Clock,
    CheckCircle2,
    Plus,
} from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SectionCard } from "@/components/ui/section-card"
import { BulkActionToolbar } from "@/components/shared/bulk-action-toolbar"
import { MomsWizardDialog } from "../dialogs/assistent"
import { MomsDetailDialog } from "../dialogs/moms"
import { useTextMode } from "@/providers/text-mode-provider"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useToast } from "@/components/ui/toast"

// Logic
import { useVatReport } from "./use-vat-report"

// Components
import { MomsStats } from "./components/MomsStats"
import { MomsGrid } from "./components/MomsGrid"

export function MomsdeklarationContent() {
    const navigateToAI = useNavigateToAIChat()
    const { text } = useTextMode()
    const toast = useToast()

    const {
        // State
        stats,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        selectedReport, setSelectedReport,
        showAIDialog, setShowAIDialog,
        isLoading,
        
        // Data
        filteredPeriods,
        
        // Selection
        selection,
        bulkActions,
        
        // Actions
        refreshData,
        handleUpdateReport,
    } = useVatReport()

    return (
        <main className="flex-1 flex flex-col p-4 md:p-6">
            <div className="w-full space-y-4 md:space-y-6">
                {/* Page Heading */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Momsdeklaration</h2>
                            <p className="text-muted-foreground mt-1">Hantera momsrapporter och skicka till Skatteverket.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowAIDialog(true)} className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Ny period
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <MomsStats stats={stats} text={text} />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title={text.reports.aiVatReport}
                    description={text.reports.aiVatDesc}
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('moms'))}
                />

                <MomsWizardDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                    initialData={stats.fullReport}
                    onConfirm={async () => {
                        await refreshData()
                        toast.success("Momsdeklaration skapad", "Din rapport har sparats och perioden har låsts.")
                    }}
                />

                {/* Table Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 mb-2">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla perioder</h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Sök period..."
                            className="w-full sm:w-48"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FilterButton
                                    label="Status"
                                    isActive={!!statusFilter}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                    Alla
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Kommande
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Inskickad
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Grid */}
                <MomsGrid 
                    periods={filteredPeriods}
                    selection={selection}
                    onSelectReport={setSelectedReport}
                />

                <BulkActionToolbar
                    selectedCount={selection.selectedCount}
                    selectedIds={selection.selectedIds}
                    onClearSelection={selection.clearSelection}
                    actions={bulkActions}
                />

                {/* VAT Report Detail Dialog */}
                <MomsDetailDialog
                    report={selectedReport}
                    open={!!selectedReport}
                    onOpenChange={(open) => !open && setSelectedReport(null)}
                    onSave={handleUpdateReport}
                />
            </div>
        </main>
    )
}
