"use client"

import { cn } from "@/lib/utils"
import {
    Plus,
    Pencil,
    Trash2,
    FileText,
    Receipt,
    CreditCard,
    Users,
    Calculator,
    Check,
    AlertTriangle,
    XCircle,
    Clock,
    ClipboardCheck,
    type LucideIcon,
} from "lucide-react"

export type FeedAction = "created" | "updated" | "deleted" | "calculated" | "prepared" | "booked" | "done" | "warning" | "error" | "pending"
export type FeedEntity = "receipt" | "transaction" | "invoice" | "payslip" | "report" | "shareholder" | "document" | "employee" | "check"

export interface FeedEvent {
    id: string
    action: FeedAction
    entityType: FeedEntity
    title: string
    description?: string | null
    timestamp?: string | null
}

export interface ActivityFeedCardProps {
    title: string
    description?: string
    events: FeedEvent[]
    className?: string
}

const actionConfig: Record<FeedAction, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    // Activity actions
    created:    { icon: Plus,          color: "text-green-600 dark:text-green-500",     bg: "bg-green-500/10",   label: "skapad" },
    updated:    { icon: Pencil,        color: "text-blue-600 dark:text-blue-500",       bg: "bg-blue-500/10",    label: "uppdaterad" },
    deleted:    { icon: Trash2,        color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10",     label: "borttagen" },
    calculated: { icon: Calculator,    color: "text-purple-600 dark:text-purple-500",   bg: "bg-purple-500/10",  label: "beräknad" },
    prepared:   { icon: FileText,      color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10",   label: "förberedd" },
    booked:     { icon: Check,         color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10", label: "bokförd" },
    // Status actions (checklist mode)
    done:       { icon: Check,         color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10", label: "OK" },
    warning:    { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10",   label: "Varning" },
    error:      { icon: XCircle,       color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10",     label: "Saknas" },
    pending:    { icon: Clock,         color: "text-zinc-500 dark:text-zinc-400",       bg: "bg-zinc-500/10",    label: "Väntar" },
}

const entityIcons: Record<FeedEntity, LucideIcon> = {
    receipt: Receipt,
    transaction: CreditCard,
    invoice: FileText,
    payslip: FileText,
    report: FileText,
    shareholder: Users,
    document: FileText,
    employee: Users,
    check: ClipboardCheck,
}

/**
 * ActivityFeedCard — universal badge-based list card.
 *
 * Two modes:
 * 1. **Activity timeline** — events with action badges (bokförd, skapad) + timestamps.
 *    Used when user asks "what happened yesterday?" or "show me last week's activity".
 * 2. **Status checklist** — items with status badges (OK, Varning, Saknas) + no timestamps.
 *    Used for workflow checklists like månadsavslut or missing-data lists.
 *
 * Replaces the old dot-based StatusListCard.
 */
export function ActivityFeedCard({
    title,
    description,
    events,
    className,
}: ActivityFeedCardProps) {
    return (
        <div className={cn("w-full max-w-md py-1", className)}>
            {/* Header */}
            <div className="mb-3">
                <p className="text-sm font-semibold">{title}</p>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>

            {/* Timeline */}
            <div className="space-y-0.5">
                {events.map((event) => {
                    const config = actionConfig[event.action]
                    const EntityIcon = entityIcons[event.entityType]

                    return (
                        <div
                            key={event.id}
                            className="flex items-start gap-3 px-2 py-2 rounded-lg"
                        >
                            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md shrink-0 mt-0.5", config.bg)}>
                                <EntityIcon className={cn("h-3 w-3", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{event.title}</span>
                                    <span className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                        config.bg, config.color
                                    )}>
                                        {config.label}
                                    </span>
                                </div>
                                {event.description && (
                                    <p className="text-xs text-muted-foreground">{event.description}</p>
                                )}
                            </div>
                            {event.timestamp && (
                                <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                                    {event.timestamp}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
