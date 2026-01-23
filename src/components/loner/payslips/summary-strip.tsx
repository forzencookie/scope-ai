"use client"

import { Calendar, Banknote, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SummaryStripProps {
    stats: {
        currentPeriod: string
        employeeCount: number
        totalGross: number
        totalTax: number
    }
}

export function SummaryStrip({ stats }: SummaryStripProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{stats.currentPeriod}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
                <span className="text-sm"><span className="font-semibold tabular-nums">{stats.employeeCount}</span> anställda</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(stats.totalGross)}</span>
                <span className="text-sm text-muted-foreground">brutto</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">{formatCurrency(stats.totalTax)}</span>
                <span className="text-sm text-muted-foreground">skatt</span>
            </div>
        </div>
    )
}
