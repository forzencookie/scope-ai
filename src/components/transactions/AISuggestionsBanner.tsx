"use client"

import { Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MIN_CONFIDENCE_AUTO_APPROVE } from "./constants"

interface AISuggestionsBannerProps {
    pendingSuggestions: number
    onApproveAll: () => void
}

export function AISuggestionsBanner({ 
    pendingSuggestions, 
    onApproveAll 
}: AISuggestionsBannerProps) {
    if (pendingSuggestions <= 0) {
        return null
    }

    return (
        <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-800/50">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400/70" />
                </div>
                <div>
                    <p className="font-medium text-sm">
                        AI har {pendingSuggestions} kategoriseringsförslag
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Granska och godkänn för snabbare bokföring
                    </p>
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-violet-600 dark:text-violet-400/80 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50"
                onClick={onApproveAll}
            >
                <Zap className="h-4 w-4 mr-1" />
                Godkänn alla ({MIN_CONFIDENCE_AUTO_APPROVE}%+)
            </Button>
        </div>
    )
}
