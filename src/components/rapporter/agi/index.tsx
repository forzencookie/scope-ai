"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useEmployerDeclaration, AGIReport } from "./use-employer-declaration"
import { AgiStats } from "./components/AgiStats"
import { AgiList } from "./components/AgiList"
import { AGIDetailsDialog } from "@/components/rapporter/dialogs/agi"
import { Clock, CheckCircle2 } from "lucide-react"

export function AGIContent() {
    const navigateToAI = useNavigateToAIChat()
    const [selectedReport, setSelectedReport] = useState<AGIReport | null>(null)
    const {
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        filteredReports,
        stats,
        isLoading,
    } = useEmployerDeclaration()

    return (
        <div className="w-full">
            <div className="w-full space-y-4 md:space-y-6">
                {/* Page Heading */}
                <PageHeader
                    title="Arbetsgivardeklaration"
                    subtitle="Hantera AGI-rapporter och skicka till Skatteverket."
                    actions={
                        <Button
                            className="gap-2 overflow-hidden w-[120px] sm:w-auto"
                            onClick={() => navigateToAI(getDefaultAIContext('agi'))}
                        >
                            <Bot className="h-4 w-4 shrink-0" />
                            <span className="truncate">Ny period</span>
                        </Button>
                    }
                />

                {/* Stats */}
                <AgiStats stats={stats} isLoading={isLoading} />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

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
                                <DropdownMenuItem onClick={() => setStatusFilter("Klar")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Ej inlämnad
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Inskickad")}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Inskickad
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Period List */}
                <AgiList
                    reports={filteredReports}
                    onSelectReport={setSelectedReport}
                />

                {/* Detail Dialog */}
                <AGIDetailsDialog
                    report={selectedReport}
                    open={!!selectedReport}
                    onOpenChange={(open) => !open && setSelectedReport(null)}
                />
            </div>
        </div>
    )
}
