"use client"

import React from "react"
import { cn, formatCurrency } from "@/lib/utils"
import type { DataRowIcon } from "@/lib/ai/schema"

function statusVariant(status: string): "success" | "warning" | "error" | "neutral" {
    const s = status.toLowerCase()
    if (["bokförd", "betald", "skickad", "ok", "paid", "done"].some(v => s.includes(v))) return "success"
    if (["förfallen", "saknas", "error", "fel"].some(v => s.includes(v))) return "error"
    if (["obokförd", "granskning", "utkast", "varning", "review", "warning"].some(v => s.includes(v))) return "warning"
    return "neutral"
}

const badgeColors = {
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    error:   "bg-red-500/10 text-red-600 dark:text-red-400",
    neutral: "bg-muted text-muted-foreground",
}

export interface DataRowProps {
    icon?: DataRowIcon
    title: string
    description?: string
    timestamp?: string
    status?: string
    amount?: number
    isNew?: boolean
    highlight?: boolean
    className?: string
    style?: React.CSSProperties
}

export function DataRow({
    title,
    description,
    timestamp,
    status,
    amount,
    isNew,
    highlight,
    className,
    style,
}: DataRowProps) {
    const variant = status ? statusVariant(status) : null

    return (
        <div
            className={cn(
                "relative flex items-center gap-3 px-2 py-2 rounded-lg",
                highlight && "bg-muted/40",
                className,
            )}
            style={style}
        >
            {isNew && (
                <span className="absolute -top-1.5 right-2 bg-background px-1.5 py-0.5 rounded text-[10px] font-medium text-blue-600 dark:text-blue-400">
                    Ny
                </span>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium truncate", highlight && "text-foreground")}>
                        {title}
                    </span>
                    {status && variant && (
                        <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded", badgeColors[variant])}>
                            {status}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                )}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-0.5">
                {amount != null && (
                    <span className={cn("text-sm tabular-nums", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {formatCurrency(amount)}
                    </span>
                )}
                {timestamp && (
                    <span className="text-[10px] text-muted-foreground">{timestamp}</span>
                )}
            </div>
        </div>
    )
}
