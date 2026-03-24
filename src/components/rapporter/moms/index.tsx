"use client"

import {
    Bot,
    Clock,
    CheckCircle2,
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
import { text } from "@/lib/translations"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"

// Logic
import { useVatReport } from "./use-vat-report"

// Components
import { MomsStats } from "./components/MomsStats"
import { MomsList } from "./components/MomsList"

export function MomsdeklarationContent() {
    const navigateToAI = useNavigateToAIChat()


    const {
        // State
        stats,
        isLoading,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        // Data
        filteredPeriods,

        // Selection
        selection,
        bulkActions,

        // Actions
        refreshData,
    } = useVatReport()

    return (
        <div className="w-full">
            <div className="w-full space-y-4 md:space-y-6">
                {/* Page Heading */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Momsdeklaration</h2>
                            <p className="text-muted-foreground mt-1">Hantera momsrapporter och skicka till Skatteverket.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => navigateToAI(getDefaultAIContext('moms'))} className="w-full sm:w-auto">
                                <Bot className="h-4 w-4 mr-2" />
                                Ny period
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <MomsStats stats={stats} text={text} isLoading={isLoading} />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title={text.reports.aiVatReport}
                    description={text.reports.aiVatDesc}
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('moms'))}
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

                {/* Main List */}
                <MomsList
                    periods={filteredPeriods}
                    onSelectReport={(report) => navigateToAI({
                        pageName: "Momsdeklaration",
                        pageType: "moms",
                        initialPrompt: `Visa momsdeklaration för ${report.period}`,
                        autoSend: true,
                    })}
                    onGenerateAI={() => {
                        navigateToAI(getDefaultAIContext('moms'))
                    }}
                />

                <BulkActionToolbar
                    selectedCount={selection.selectedCount}
                    selectedIds={selection.selectedIds}
                    onClearSelection={selection.clearSelection}
                    actions={bulkActions}
                />

            </div>
        </div>
    )
}
