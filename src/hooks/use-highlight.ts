"use client"

/**
 * useHighlight - Hook for highlighting newly created content
 * Listens to the AI dialog provider for highlight state
 */

import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Hook to check if a specific content ID should be highlighted
 * Returns animation classes and state for that ID
 */
export function useHighlight(contentId: string | undefined) {
    const context = useAIDialogOptional()
    const searchParams = useSearchParams()

    const isHighlighted = useMemo(() => {
        if (!contentId) return false
        
        // 1. Check AI Overlay context (immediate feedback)
        if (context && context.highlightedId === contentId) return true
        
        // 2. Check search params (navigation-based highlighting)
        const highlightId = searchParams.get('highlight') || searchParams.get('id')
        if (highlightId === contentId) return true
        
        return false
    }, [context, contentId, searchParams])

    const highlightClass = isHighlighted
        ? "animate-highlight ring-2 ring-emerald-500/50 bg-emerald-500/10 rounded-lg transition-all duration-700 shadow-sm"
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
