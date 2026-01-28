"use client"

import { Bot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SectionCard } from "@/components/ui/section-card"
import { BulkActionToolbar, PageHeader } from "@/components/shared"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useEmployerDeclaration } from "./use-employer-declaration"
import { AgiStats } from "./components/AgiStats"
import { AgiGrid } from "./components/AgiGrid"
import { Clock, CheckCircle2 } from "lucide-react"

export function AGIContent() {
    const navigateToAI = useNavigateToAIChat()
    const {
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        selectedIds,
        filteredReports,
        stats,
        toggleSelection,
        toggleAll,
        bulkActions,
        clearSelection
    } = useEmployerDeclaration()

    return (
        <main className="flex-1 flex flex-col p-4 md:p-6">
            <div className="w-full space-y-4 md:space-y-6">
                {/* Page Heading */}
                <PageHeader
                    title="Arbetsgivardeklaration"
                    subtitle="Hantera AGI-rapporter och skicka till Skatteverket."
                    actions={
                        <Button size="sm" className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Ny period
                        </Button>
                    }
                />

                {/* Stats */}
                <AgiStats stats={stats} />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-arbetsgivardeklaration"
                    description="Låt AI sammanställa och granska din arbetsgivardeklaration automatiskt."
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('agi'))}
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
                                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Ej inlämnad
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Inlämnad
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="relative">
                    <AgiGrid
                        reports={filteredReports}
                        selectedIds={selectedIds}
                        onToggleSelection={toggleSelection}
                        onToggleAll={toggleAll}
                    />
                 
                    <BulkActionToolbar
                        selectedCount={selectedIds.size}
                        selectedIds={Array.from(selectedIds)}
                        actions={bulkActions.map(action => ({
                            ...action,
                            onClick: () => action.onClick?.(Array.from(selectedIds))
                        }))}
                        onClearSelection={clearSelection}
                    />
                </div>
            </div>
        </main>
    )
}
