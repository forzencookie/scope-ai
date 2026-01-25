"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { BulkActionToolbar } from "@/components/shared/bulk-action-toolbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployerDeclaration } from "./use-employer-declaration"
import { AgiStats } from "./components/AgiStats"
import { AgiGrid } from "./components/AgiGrid"

export function AGIContent() {
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
        <div className="space-y-4 md:space-y-6">
            <AgiStats stats={stats} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 relative w-full sm:max-w-sm">
                    <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
                    <Input
                        placeholder="Sök period..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={statusFilter || "all"}
                    onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Alla statusar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alla statusar</SelectItem>
                        <SelectItem value="submitted">Inlämnad</SelectItem>
                        <SelectItem value="pending">Ej inlämnad</SelectItem>
                    </SelectContent>
                </Select>
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
                        onClick: () => action.onClick(Array.from(selectedIds))
                    }))}
                    onClearSelection={clearSelection}
                />
            </div>
        </div>
    )
}
