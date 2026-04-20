"use client"

import { Calculator } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export interface SummaryItem {
    label: string
    value: string | number
    highlight?: boolean
    secondary?: string
}

export interface SummaryCardProps {
    title: string
    items: SummaryItem[]
    variant?: "calculation" | "list"
    className?: string
}

export function SummaryCard({ title, items, variant = "calculation", className }: SummaryCardProps) {
    return (
        <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
            <h4 className="font-semibold flex items-center gap-2 text-sm">
                {variant === "calculation" && <Calculator className="h-4 w-4 text-primary shrink-0" />}
                {title}
            </h4>
            <div className="space-y-1">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center justify-between py-1.5 text-sm",
                            variant === "list" && "border-b last:border-0"
                        )}
                    >
                        <div>
                            <span className={cn(
                                variant === "calculation" ? "text-muted-foreground" : "font-medium"
                            )}>
                                {item.label}
                            </span>
                            {item.secondary && (
                                <p className="text-xs text-muted-foreground">{item.secondary}</p>
                            )}
                        </div>
                        {item.value !== undefined && item.value !== "" && (
                            <span className={cn(
                                "font-medium tabular-nums",
                                item.highlight && "text-primary font-bold"
                            )}>
                                {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
