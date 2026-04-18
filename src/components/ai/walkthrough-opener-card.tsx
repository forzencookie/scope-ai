"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface WalkthroughOpenerCardProps {
    title: string
    subtitle: string
    icon?: LucideIcon
    iconBg?: string
    iconColor?: string
    onOpen: () => void
}

export function WalkthroughOpenerCard({
    title,
    subtitle,
    icon: Icon,
    iconBg = "bg-muted",
    iconColor = "text-muted-foreground",
    onOpen,
}: WalkthroughOpenerCardProps) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60 text-left"
        >
            {Icon && (
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", iconBg)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </button>
    )
}
