"use client"

import { cn } from "@/lib/utils"
import { DataRow } from "./data-row"
import type { Block as BlockData, DataRowIcon } from "@/lib/ai/schema"
import {
    FileText, CreditCard, Receipt, BookOpen,
    Users, PieChart, Package, Gift, Percent,
    ClipboardCheck, type LucideIcon,
} from "lucide-react"

const iconMap: Record<DataRowIcon, LucideIcon> = {
    invoice:      FileText,
    transaction:  CreditCard,
    receipt:      Receipt,
    verification: BookOpen,
    payslip:      FileText,
    report:       PieChart,
    shareholder:  Users,
    employee:     Users,
    asset:        Package,
    benefit:      Gift,
    partner:      Percent,
    check:        ClipboardCheck,
}

const iconColors: Record<DataRowIcon, { icon: string; bg: string }> = {
    invoice:      { icon: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/10" },
    transaction:  { icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    receipt:      { icon: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/10" },
    verification: { icon: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-500/10" },
    payslip:      { icon: "text-green-600 dark:text-green-400",     bg: "bg-green-500/10" },
    report:       { icon: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10" },
    shareholder:  { icon: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-500/10" },
    employee:     { icon: "text-green-600 dark:text-green-400",     bg: "bg-green-500/10" },
    asset:        { icon: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-500/10" },
    benefit:      { icon: "text-green-600 dark:text-green-400",     bg: "bg-green-500/10" },
    partner:      { icon: "text-purple-600 dark:text-purple-400",   bg: "bg-purple-500/10" },
    check:        { icon: "text-zinc-500 dark:text-zinc-400",       bg: "bg-zinc-500/10" },
}

export interface BlockProps {
    block: BlockData
    className?: string
}

export function Block({ block, className }: BlockProps) {
    if (!block.rows.length) return null

    // Use explicit block icon, fall back to first row's icon
    const iconKey = block.icon ?? block.rows[0]?.icon
    const Icon = iconKey ? iconMap[iconKey] : null
    const colors = iconKey ? iconColors[iconKey] : null

    return (
        <div className={cn("w-full max-w-md py-1", className)}>
            {(Icon || block.title || block.description) && (
                <div className="flex items-center gap-2.5 mb-3">
                    {Icon && colors && (
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", colors.bg)}>
                            <Icon className={cn("h-3.5 w-3.5", colors.icon)} />
                        </div>
                    )}
                    {(block.title || block.description) && (
                        <div>
                            {block.title && <p className="text-sm font-semibold">{block.title}</p>}
                            {block.description && <p className="text-xs text-muted-foreground">{block.description}</p>}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-0.5">
                {block.rows.map((row, i) => (
                    <DataRow
                        key={i}
                        title={row.title}
                        description={row.description}
                        timestamp={row.timestamp}
                        status={row.status}
                        amount={row.amount}
                        isNew={row.isNew}
                        highlight={row.highlight}
                        style={{ animationDelay: `${i * 60}ms` }}
                        className="animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-both"
                    />
                ))}
            </div>
        </div>
    )
}
