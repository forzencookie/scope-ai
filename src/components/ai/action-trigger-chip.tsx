"use client"

import { cn } from "@/lib/utils"
import {
    FileText,
    Calendar,
    Receipt,
    FileSpreadsheet,
    Gavel,
    Users,
    Scale,
    LucideIcon
} from "lucide-react"

export type ActionTriggerIcon =
    | 'document'
    | 'meeting'
    | 'receipt'
    | 'invoice'
    | 'decision'
    | 'shareholders'
    | 'audit'

const iconMap: Record<ActionTriggerIcon, LucideIcon> = {
    document: FileText,
    meeting: Calendar,
    receipt: Receipt,
    invoice: FileSpreadsheet,
    decision: Gavel,
    shareholders: Users,
    audit: Scale,
}

export interface ActionTriggerDisplay {
    type: 'action-trigger'
    icon: ActionTriggerIcon
    title: string
    subtitle?: string
    meta?: string
}

interface ActionTriggerChipProps {
    display: ActionTriggerDisplay
    className?: string
}

/**
 * ActionTriggerChip - Displays a user's AI action trigger as a nice chip
 * instead of showing the raw prompt text
 */
export function ActionTriggerChip({ display, className }: ActionTriggerChipProps) {
    const Icon = iconMap[display.icon] || FileText

    return (
        <div className={cn(
            "inline-flex flex-col gap-0.5 rounded-xl px-4 py-3",
            "bg-gradient-to-br from-primary/10 to-primary/5",
            "border border-primary/20",
            "max-w-[280px]",
            className
        )}>
            <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-medium text-sm">{display.title}</span>
            </div>
            {display.subtitle && (
                <p className="text-xs text-muted-foreground pl-8">{display.subtitle}</p>
            )}
            {display.meta && (
                <p className="text-xs text-muted-foreground/70 pl-8">{display.meta}</p>
            )}
        </div>
    )
}
