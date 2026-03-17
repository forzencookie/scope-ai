"use client"

import { Plus, Calculator, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { SearchBar } from "@/components/ui/search-bar"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

// Logic
import { useInventarierLogic } from "./use-inventarier-logic"

// Sub-components
import { InventarierStats } from "./stats"
import { InventarierGrid } from "./grid"

/**
 * InventarierTable - Read-only view of company assets.
 * 
 * ALL MUTATIONS (Adding assets, booking depreciation) are handled by Scooby.
 */
export function InventarierTable() {
    const { navigateToAI } = useChatNavigation()
    const {
        // State
        searchQuery, setSearchQuery,
        isLoading,

        // Data
        filteredInventarier,
        stats,
        selection,
    } = useInventarierLogic()

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header Section */}
            <PageHeader
                title="Tillgångar"
                subtitle="Datorer, möbler och andra saker du äger."
                actions={
                    <Button 
                        className="gap-2" 
                        onClick={() => navigateToAI({ prompt: "Jag vill lägga till en ny inventarie" })}
                    >
                        <Plus className="h-4 w-4" />
                        Ny tillgång
                    </Button>
                }
            />


            {/* Stats Cards */}
            <InventarierStats stats={stats} isLoading={isLoading} />

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Table Title */}
            <div className="flex items-center justify-between gap-3 py-1">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                    Alla tillgångar
                </h3>
                <div className="flex items-center gap-2">
                    <SearchBar
                        placeholder="Sök tillgång..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    <Button 
                        variant="secondary" 
                        className="gap-2 shrink-0" 
                        onClick={() => navigateToAI({ prompt: "Hjälp mig att bokföra avskrivningar för mina inventarier" })}
                    >
                        <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
                        <span className="truncate">Bokför avskrivning</span>
                    </Button>
                </div>
            </div>

            {/* Assets Grid */}
            <InventarierGrid
                inventarier={filteredInventarier}
                isLoading={isLoading}
                selection={selection}
            />
        </div>
    )
}
