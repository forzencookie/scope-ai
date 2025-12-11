"use client"

import { memo } from "react"
import { Check, X } from "lucide-react"
import { type AISuggestion } from "@/data/transactions"
import { cn } from "@/lib/utils"

interface AISuggestionBadgeProps {
    suggestion: AISuggestion
    onApprove: () => void
    onReject: () => void
    isApproved: boolean
    /** Compact mode for dense table views */
    compact?: boolean
}

// AI Suggestion badge component - memoized to prevent unnecessary re-renders
// Touch targets sized to 44x44px minimum per Apple HIG / Fitts's Law
export const AISuggestionBadge = memo(function AISuggestionBadge({ 
    suggestion, 
    onApprove, 
    onReject,
    isApproved,
    compact = false,
}: AISuggestionBadgeProps) {
    if (isApproved) {
        return (
            <div className="flex items-center gap-2 text-emerald-600 py-1">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Godkänd</span>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex items-center gap-3",
            compact ? "flex-row" : "flex-col sm:flex-row"
        )}>
            {/* Category and confidence badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-800/50">
                <span className="text-sm font-medium text-violet-700 dark:text-violet-400/80">{suggestion.category}</span>
                <span className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    suggestion.confidence >= 90 
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400/80" 
                        : suggestion.confidence >= 70 
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400/80"
                            : "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400/80"
                )}>
                    {suggestion.confidence}%
                </span>
            </div>
            
            {/* Action buttons with 44px touch targets */}
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onApprove(); }}
                    className={cn(
                        "min-h-[44px] min-w-[44px] px-3 rounded-lg flex items-center justify-center gap-2",
                        "text-emerald-700 bg-emerald-50 border border-emerald-200",
                        "hover:bg-emerald-100 hover:border-emerald-300",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
                        "active:bg-emerald-200 transition-colors",
                        "touch-manipulation" // Prevents 300ms delay on mobile
                    )}
                    title="Godkänn förslag"
                    aria-label={`Godkänn kategorisering: ${suggestion.category}`}
                >
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">Godkänn</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(); }}
                    className={cn(
                        "min-h-[44px] min-w-[44px] px-3 rounded-lg flex items-center justify-center gap-2",
                        "text-muted-foreground bg-muted/50 border border-border/50",
                        "hover:text-red-600 hover:bg-red-50 hover:border-red-200",
                        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                        "active:bg-red-100 transition-colors",
                        "touch-manipulation"
                    )}
                    title="Avvisa förslag"
                    aria-label={`Avvisa kategorisering: ${suggestion.category}`}
                >
                    <X className="h-5 w-5" />
                    <span className="text-sm font-medium hidden sm:inline">Avvisa</span>
                </button>
            </div>
        </div>
    )
})
