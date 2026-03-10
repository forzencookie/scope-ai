"use client"

import React from "react"
import { LucideIcon, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { cn } from "@/lib/utils"

interface ActionEmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    actionPrompt?: string
    className?: string
}

export function ActionEmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionPrompt,
    className
}: ActionEmptyStateProps) {
    const navigateToAI = useNavigateToAIChat()

    const handleAction = () => {
        if (actionPrompt) {
            const context = getDefaultAIContext('transaktion', true)
            context.initialPrompt = actionPrompt
            navigateToAI(context)
        }
    }

    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-300", className)}>
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/50">
                <Icon className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-[300px] mb-8 text-sm leading-relaxed">
                {description}
            </p>
            {actionLabel && (
                <Button 
                    onClick={handleAction} 
                    className="gap-2 shadow-sm hover:shadow-md transition-all"
                >
                    <MessageSquarePlus className="h-4 w-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
