"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type StatusVariant = "success" | "warning" | "error" | "neutral"

const STATUS_COLORS: Record<StatusVariant, string> = {
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    error:   "bg-red-500/10 text-red-600 dark:text-red-400",
    neutral: "bg-muted text-muted-foreground",
}

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
    "Inskickad": "success", "Betald": "success", "Godkänd": "success", "Klar": "success",
    "Utkast": "neutral", "Ej påbörjad": "neutral",
    "Kommande": "warning", "Förfallen": "error",
}

interface WalkthroughOpenerCardProps {
    title: string
    subtitle: string
    icon?: LucideIcon
    iconBg?: string
    iconColor?: string
    status?: string
    onOpen: () => void
}

export function WalkthroughOpenerCard({
    title,
    subtitle,
    icon: Icon,
    iconBg = "bg-muted",
    iconColor = "text-muted-foreground",
    status,
    onOpen,
}: WalkthroughOpenerCardProps) {
    const statusVariant: StatusVariant = status ? (STATUS_VARIANT_MAP[status] ?? "neutral") : "neutral"

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
            {status && (
                <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[statusVariant])}>
                    {status}
                </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </button>
    )
}
