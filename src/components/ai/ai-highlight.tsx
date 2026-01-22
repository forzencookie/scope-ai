"use client"

/**
 * AIHighlight - Wrapper component for highlighting AI-created content
 * Shows a glow effect when the item is highlighted via the AI dialog accept flow
 */

import { motion, AnimatePresence } from "framer-motion"
import { useAIDialogOptional } from "@/providers/ai-overlay-provider"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface AIHighlightProps {
    /** Unique ID to match against highlightedId from context */
    id: string
    /** Content to wrap */
    children: ReactNode
    /** Additional class names */
    className?: string
    /** Whether to show rounded corners on the highlight */
    rounded?: boolean
}

export function AIHighlight({ id, children, className, rounded = true }: AIHighlightProps) {
    const context = useAIDialogOptional()
    const isHighlighted = context?.highlightedId === id

    return (
        <div className={cn("relative", className)}>
            <AnimatePresence>
                {isHighlighted && (
                    <motion.div
                        className={cn(
                            "absolute inset-0 pointer-events-none z-10",
                            "ring-2 ring-primary/70 bg-primary/5",
                            rounded && "rounded-lg"
                        )}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{
                            opacity: [0.5, 1, 0.5],
                            scale: 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                            scale: { duration: 0.3 },
                        }}
                    />
                )}
            </AnimatePresence>
            {children}
        </div>
    )
}

/**
 * Hook to check if a specific ID is currently highlighted
 */
export function useAIHighlight(id: string): boolean {
    const context = useAIDialogOptional()
    return context?.highlightedId === id
}
