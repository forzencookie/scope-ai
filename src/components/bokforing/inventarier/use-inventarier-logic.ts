"use client"

import { useState, useMemo } from "react"
import { useInventarier } from "@/hooks/use-inventarier"

/**
 * useInventarierLogic - Read-only logic for the Inventarier (Assets) dashboard.
 * 
 * ALL MUTATIONS (Adding assets, booking depreciation) are handled by Scooby via AI Tools.
 * This hook purely maps database state to the UI.
 */
export function useInventarierLogic() {
    const { 
        inventarier, 
        isLoading, 
        error, 
        stats, 
        fetchInventarier 
    } = useInventarier()

    // Search/Filter state
    const [searchQuery, setSearchQuery] = useState("")

    // 1. Filtering
    const filteredInventarier = useMemo(() => {
        if (!searchQuery) return inventarier
        const query = searchQuery.toLowerCase()
        return inventarier.filter(item =>
            item.namn.toLowerCase().includes(query) ||
            item.kategori.toLowerCase().includes(query)
        )
    }, [inventarier, searchQuery])

    // 2. Selection logic (for read-only bulk actions like Export)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const selection = useMemo(() => ({
        selectedIds,
        isSelected: (id: string) => selectedIds.has(id),
        toggleItem: (id: string) => {
            const next = new Set(selectedIds)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            setSelectedIds(next)
        },
        toggleAll: () => {
            if (selectedIds.size === filteredInventarier.length) {
                setSelectedIds(new Set())
            } else {
                setSelectedIds(new Set(filteredInventarier.map(i => i.id)))
            }
        },
        selectedCount: selectedIds.size
    }), [selectedIds, filteredInventarier])

    return {
        // State
        searchQuery,
        setSearchQuery,
        isLoading,
        error,

        // Data
        filteredInventarier,
        stats,
        selection,
        
        // Handlers
        refresh: fetchInventarier
    }
}
