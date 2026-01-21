"use client"

/**
 * useHighlight - Hook for highlighting newly created content
 * Listens to the AI dialog provider for highlight state
 */

import { useAIDialogOptional } from "@/providers/ai-dialog-provider"
import { useCallback, useMemo } from "react"

/**
 * Hook to check if a specific content ID should be highlighted
 * Returns animation classes and state for that ID
 */
export function useHighlight(contentId: string | undefined) {
    const context = useAIDialogOptional()

    const isHighlighted = useMemo(() => {
        if (!context || !contentId) return false
        return context.highlightedId === contentId
    }, [context, contentId])

    const highlightClass = isHighlighted
        ? "animate-highlight ring-2 ring-emerald-500/50 bg-emerald-500/5 rounded-lg transition-all duration-500"
        : ""

    return {
        isHighlighted,
        highlightClass,
    }
}

/**
 * Hook to get full highlight state and controls
 */
export function useHighlightState() {
    const context = useAIDialogOptional()

    const highlightedId = context?.highlightedId ?? null
    const clearHighlight = useCallback(() => {
        context?.clearHighlight()
    }, [context])

    return {
        highlightedId,
        clearHighlight,
        isHighlighting: !!highlightedId,
    }
}
