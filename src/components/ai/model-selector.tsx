"use client"

import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModel } from "@/providers/model-provider"
import { ASSISTANT_TIERS, getAssistantTierByModelId } from "@/lib/ai/models"
import { cn } from "@/lib/utils"

/**
 * Simplified AI Assistant Selector
 * 
 * Shows 3 user-friendly tiers instead of technical model names:
 * - Snabb (Fast) - Daily tasks, quick answers
 * - Smart - Accounting, analysis, reports  
 * - Expert - Complex planning, strategic decisions
 */
export function ModelSelector() {
    const { modelId, setModelId } = useModel()
    
    // Get current tier based on selected model
    const currentTier = getAssistantTierByModelId(modelId) || ASSISTANT_TIERS[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                    <span>{currentTier.icon}</span>
                    <span className={cn("max-w-[80px] truncate", currentTier.color)}>
                        {currentTier.name}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {ASSISTANT_TIERS.map((tier) => (
                    <DropdownMenuItem
                        key={tier.level}
                        onClick={() => setModelId(tier.modelId)}
                        className="flex items-start gap-3 cursor-pointer py-2.5 px-3"
                    >
                        <span className="text-lg mt-0.5">{tier.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-medium",
                                    tier.color,
                                    currentTier.level === tier.level && "font-semibold"
                                )}>
                                    {tier.name}
                                </span>
                                {tier.multiplier > 1 && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {tier.multiplier}x tokens
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                {tier.description}
                            </p>
                        </div>
                        {currentTier.level === tier.level && (
                            <Check className="h-4 w-4 mt-1 shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
